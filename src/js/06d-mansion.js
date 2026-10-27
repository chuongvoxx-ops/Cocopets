/* ---------- the mansion: your whole house in one cutaway view, growing as you build ----------
   Indoor rooms stack two to a floor from the ground up; gardens and farms sit on the ground beside the house.
   Every room shows its own wallpaper, furniture and the pets that are in it. Tap a room to walk in,
   tap an empty lot to build, and paint the outside whenever you like. */
const PAINTS = [
  { id: 'cream', name: 'Cream', c: '#FFF1D6', t: '#EBD3A6' }, { id: 'peach', name: 'Peach', c: '#FFD9C4', t: '#F0B693' }, { id: 'mint', name: 'Mint', c: '#D6F2DE', t: '#A9D9B6' },
  { id: 'sky', name: 'Sky', c: '#D4ECFF', t: '#A5CDEE' }, { id: 'lilac', name: 'Lilac', c: '#E7DCFF', t: '#C5B2F0' }, { id: 'rose', name: 'Rose', c: '#FFDCE8', t: '#F2B3C8' },
  { id: 'snow', name: 'Snow', c: '#FFFFFF', t: '#E2DED6' }, { id: 'honey', name: 'Honey', c: '#FFE3A3', t: '#EEC56E' }, { id: 'cocoa', name: 'Cocoa', c: '#D9B38F', t: '#B88A63' },
];
const ROOFS = [
  { id: 'terracotta', name: 'Terracotta', c: '#D96A4E', d: '#B0503A' }, { id: 'slate', name: 'Slate', c: '#6E7A99', d: '#515B75' }, { id: 'teal', name: 'Teal', c: '#4FA9A0', d: '#3A827B' },
  { id: 'navy', name: 'Navy', c: '#3E4C8A', d: '#2D376A' }, { id: 'pink', name: 'Pink', c: '#F08BAF', d: '#C96A8D' }, { id: 'moss', name: 'Moss', c: '#6E9B4C', d: '#52783A' }, { id: 'gold', name: 'Gold', c: '#E7B84A', d: '#BC9033' },
];
const paintOf = h => PAINTS.find(p => p.id === (h && h.paint)) || PAINTS[0];
const roofOf = h => ROOFS.find(p => p.id === (h && h.roof)) || ROOFS[0];
const mansionTier = n => n >= 7 ? 'Mansion' : n >= 5 ? 'Villa' : n >= 3 ? 'House' : 'Cottage';
const houseName = () => (st.house.name || `${st.name}'s ${mansionTier(st.house.rooms.length)}`);
let mansionOpen = false, mnNew = null, mnSel = -1;
const mansionEl = $('#mansion');

/* where every room sits: floors of two indoor rooms, outdoor rooms on the ground to either side */
function mansionLayout(rooms) {
  const floors = [], yard = [];
  let k = 0;
  rooms.forEach((r, i) => {
    if (ROOM_TYPES[r.type].outdoor) yard.push({ r, i });
    else { if (k % 2 === 0) floors.push([null, null]); floors[Math.floor(k / 2)][k % 2] = { r, i }; k++; }
  });
  const full = rooms.length >= MAX_ROOMS;
  let lot = null;
  if (!full) { if (floors.length && floors[floors.length - 1][1] === null) lot = { f: floors.length - 1, c: 1 }; else { floors.push([null, null]); lot = { f: floors.length - 1, c: 0 }; } }
  return { floors, yard, lot, yardLot: !full };
}
const skyNow = () => roomEl.dataset.sky || 'day';
const roofSVG = () => `<svg class="mn-roof" viewBox="0 0 220 70" preserveAspectRatio="none" aria-hidden="true"><rect x="150" y="12" width="20" height="34" fill="#B07A5A" stroke="var(--line)" stroke-width="3" stroke-linejoin="round"/><rect x="146" y="8" width="28" height="8" fill="#8E5A3C" stroke="var(--line)" stroke-width="3" stroke-linejoin="round"/><path d="M4 68 110 4 216 68Z" fill="var(--roof)" stroke="var(--line)" stroke-width="3" stroke-linejoin="round"/><path d="M110 4 216 68H110Z" fill="rgba(0,0,0,.16)"/><path d="M110 4 4 68H110Z" fill="rgba(255,255,255,.1)"/><path d="M38 50h144M64 34h92M88 20h44" stroke="var(--roof2)" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle cx="110" cy="46" r="10" fill="#FFE39A" stroke="var(--line)" stroke-width="2.5"/><path d="M110 36v20M100 46h20" stroke="var(--line)" stroke-width="2"/></svg>`;
/* a small copy of a room: its wallpaper, floor, furniture, crops and the pets that are there */
function miniRoomHTML(r, i, rw, rh, here) {
  const T = ROOM_TYPES[r.type], th = THEMES.find(t => t.id === r.theme) || THEMES[0], out = !!T.outdoor;
  const wallH = rh * (out ? 0.4 : 0.46), mps = rw * 0.27;
  const F = { x0: rw * 0.03, x1: rw * 0.97, y0: wallH + rh * 0.03, y1: rh * 0.985 };
  const WR = { x0: rw * 0.04, x1: rw * 0.96, y0: rh * 0.07, y1: wallH - rh * 0.04 };
  let items = '';
  for (const it of r.items) {
    const def = ITEMS[it.id]; if (!def) continue;
    let x, y, w, h, z;
    if (def.place === 'wall') { w = def.w * mps; h = w * def.vb[1] / def.vb[0]; x = clamp(WR.x0 + it.fx * (WR.x1 - WR.x0), WR.x0 + w / 2, WR.x1 - w / 2); const topMax = Math.max(WR.y0, WR.y1 - h); y = WR.y0 + it.fy * (topMax - WR.y0) + h; z = 1; }
    else { const ds = 0.86 + 0.14 * it.fy; w = def.w * mps * ds; h = w * def.vb[1] / def.vb[0]; x = clamp(F.x0 + it.fx * (F.x1 - F.x0), F.x0 + w * 0.42, F.x1 - w * 0.42); y = F.y0 + it.fy * (F.y1 - F.y0); z = def.place === 'floor' ? 10 + Math.round(y) : 2; }
    items += `<i class="mn-it${it.flip ? ' flip' : ''}${def.lamp ? ' lamp' : ''}" style="left:${(x - w / 2).toFixed(1)}px;top:${(y - h).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;z-index:${z}">${itemArt(it.id)}</i>`;
  }
  if (r.plots) {
    const w = clamp(mps * 0.9, 24, 60), h = w * 0.75;
    r.plots.forEach((q, n) => { const [fx, fy] = PLOT_POS[n]; const x = clamp(F.x0 + fx * (F.x1 - F.x0), F.x0 + w / 2, F.x1 - w / 2), y = F.y0 + fy * (F.y1 - F.y0) + h * 0.3; items += `<i class="mn-it" style="left:${(x - w / 2).toFixed(1)}px;top:${(y - h).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;z-index:${5 + Math.round(y)}">${plotSVG(q, cropStage(q))}</i>`; });
  }
  let pets = '';
  if (here) {
    const all = [st].concat(st.others), n = all.length;
    all.forEach((p, j) => {
      const f = formOf(p), sz = rw * 0.26 * clamp(STAGES[p.stage].scale * (f.grow || 1), 0.6, 1.1) * (n > 4 ? 0.8 : 1);
      const fx = n === 1 ? 0.5 : 0.16 + 0.68 * (j / (n - 1)), fy = n <= 2 ? 0.62 : 0.5 + 0.3 * ((j % 2) ? 1 : 0.35);
      const x = F.x0 + fx * (F.x1 - F.x0), y = F.y0 + fy * (F.y1 - F.y0);
      const asleep = p === st ? st.asleep : p.asleep;
      pets += `<i class="mn-pet" style="left:${(x - sz / 2).toFixed(1)}px;top:${(y - sz).toFixed(1)}px;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;z-index:${10 + Math.round(y)};animation-delay:${(-j * 0.7).toFixed(1)}s" title="${esc(p.name)}">${petSVG(f, { frame: 'fit', eyes: asleep ? 'closed' : 'normal', mouth: asleep ? 'o' : 'smile', lite: true })}</i>`;
    });
  }
  const sky = skyNow(), night = sky === 'night';
  const wall = out ? '' : `--wall:${th.wall};`, floor = out ? (r.type === 'farm' ? '--floor:#B98A57;--floor2:#9C7149;' : '--floor:#8FD07D;--floor2:#6DB85E;') : `--floor:${th.floor};`;
  const win = out ? `<i class="mn-sun ${sky}"></i><i class="mn-hill"></i>` : `<i class="mn-win" data-sky="${sky}"></i>`;
  const sel = i === mnSel;
  return `<div class="mn-room${here ? ' here' : ''}${sel ? ' sel' : ''}${out ? ' outdoor ' + r.type : ' indoor'}${night && !out && !st.lightsOff ? ' lit' : ''}${mnNew === r.id ? ' new' : ''}" data-i="${i}" role="button" tabindex="0" aria-pressed="${sel}" aria-label="${esc(r.name)}${here ? ', you are here' : ''}. ${sel ? 'Tap again to walk in' : 'Select'}" style="${wall}${floor}--wh:${wallH.toFixed(1)}px;width:${rw}px;height:${rh}px">
    <div class="mn-wall">${win}</div><div class="mn-floor"></div>${items}${pets}
    <span class="mn-name">${ICON[T.icon] || ICON.house}${esc(r.name)}</span>
    ${here ? '<span class="mn-here">Here</span>' : ''}
  </div>`;
}
function lotHTML(kind, rw, rh) {
  const label = kind === 'ground' ? 'Garden or farm' : 'Build a room';
  return `<button class="mn-lot ${kind}" type="button" data-lot="${kind}" style="width:${rw}px;height:${rh}px" aria-label="Empty lot. ${label}"><span class="mn-lot-ic">${ICON.mansion}</span><b>+ ${label}</b></button>`;
}
function renderMansion() {
  if (!mansionOpen || !st) return;
  const rooms = st.house.rooms, L = mansionLayout(rooms), cur = st.house.cur;
  if (mnSel < 0 || mnSel >= rooms.length) mnSel = cur;
  const vw = Math.min(window.innerWidth, 560);
  const rw = Math.round(clamp((vw - 34 - 6) / 2, 118, 168)), rh = Math.round(rw * 0.8);
  const yardN = L.yard.length + (L.yardLot ? 1 : 0), per = Math.min(3, Math.max(2, yardN));
  const ow = Math.round(Math.min(rw * 0.8, (rw * 2 + 6 - 6 * (per - 1)) / per)), oh = Math.round(ow * 0.84);
  const paint = paintOf(st.house), roof = roofOf(st.house), sky = skyNow();
  mansionEl.dataset.sky = sky;
  // floors from the top down
  let floors = '';
  for (let f = L.floors.length - 1; f >= 0; f--) {
    const row = L.floors[f];
    floors += `<div class="mn-floor-row${f === 0 ? ' ground' : ''}">${[0, 1].map(c => row[c] ? miniRoomHTML(row[c].r, row[c].i, rw, rh, row[c].i === cur) : (L.lot && L.lot.f === f && L.lot.c === c ? lotHTML('indoor', rw, rh) : `<div class="mn-void" style="width:${rw}px;height:${rh}px"></div>`)).join('')}</div>`;
  }
  const yard = `<div class="mn-yard" style="max-width:${rw * 2 + 34}px">${L.yard.map(({ r, i }) => miniRoomHTML(r, i, ow, oh, i === cur)).join('')}${L.yardLot ? lotHTML('ground', ow, oh) : ''}</div>`;
  const bw = rw * 2 + 6 + 16;
  const cozy = rooms.reduce((a, r) => a + roomCozy(r), 0), pets = 1 + st.others.length;
  const S = rooms[mnSel], ST = ROOM_TYPES[S.type];
  mansionEl.innerHTML = `
    <div class="mn-top">
      <div class="map-row"><button class="btn small" type="button" id="mnBack"><span class="bi">${ICON.back}</span>Back</button>
        <div class="map-pills"><span class="mpill">${ICON.house}<b>${rooms.length}</b><small>/${MAX_ROOMS} rooms</small></span><span class="mpill">${ICON.heart}<b>${pets}</b><small>pet${pets > 1 ? 's' : ''}</small></span><span class="mpill">${ICON.sparkle}<b>${cozy}</b><small>cozy</small></span></div></div>
      <div class="map-row"><h2 class="mn-title">${esc(houseName())}</h2><div class="mn-actions"><button class="btn small" type="button" id="mnPaint">${ICON.brush}Paint</button><button class="btn small" type="button" id="mnBuild"${rooms.length >= MAX_ROOMS ? ' disabled' : ''}>${ICON.mansion}Build</button></div></div>
    </div>
    <div class="mn-sky"><i class="mn-stars"></i><i class="mn-orb"></i><i class="mn-cloud c1"></i><i class="mn-cloud c2"></i><i class="mn-cloud c3"></i></div>
    <div class="mn-scroll">
      <div class="mn-scene" style="--paint:${paint.c};--trim:${paint.t};--roof:${roof.c};--roof2:${roof.d};--rw:${rw}px">
        <div class="mn-building" style="width:${bw}px">
          <div class="mn-roofwrap">${roofSVG()}<i class="mn-smoke s1"></i><i class="mn-smoke s2"></i><i class="mn-smoke s3"></i></div>
          ${floors}
          <div class="mn-base"><i class="mn-door"></i><span class="mn-plaque">${esc(houseName())}</span><i class="mn-step"></i></div>
        </div>
        <div class="mn-lawn"><i class="mn-path"></i><i class="mn-bush b1"></i><i class="mn-bush b2"></i><i class="mn-fence l"></i><i class="mn-fence r"></i>${L.yard.length ? '<i class="mn-bfly a"></i><i class="mn-bfly b"></i>' : ''}${yard}</div>
      </div>
    </div>
    <div class="mn-bar">
      <div class="mn-bar-txt"><b>${esc(S.name)}${mnSel === cur ? ' <span class="mn-bar-here">you are here</span>' : ''}</b><small>${esc(ST.name)} · Cozy ${roomCozy(S)}${S.plots ? ` · ${S.plots.filter(p => p.crop).length}/6 planted` : ''}</small></div>
      <button class="btn small" type="button" data-act="more" aria-label="Rename, move or remove ${esc(S.name)}">${ICON.dots}</button>
      <button class="btn small" type="button" data-act="deco" aria-label="Decorate ${esc(S.name)}">${ICON.brush}Decorate</button>
      <button class="btn primary small" type="button" data-act="enter">${ICON.next}Walk in</button>
    </div>`;
  const sc = $('.mn-scroll', mansionEl);
  requestAnimationFrame(() => { sc.scrollLeft = Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2); const el = $(mnNew ? '.mn-room.new' : '.mn-room.sel', mansionEl); if (el && mnNew) el.scrollIntoView({ block: 'nearest', inline: 'center' }); });
  mnNew = null;
}
function openMansion() {
  if (!st) return;
  closeTray(); if (decorating) exitDecor(); if (act) endActivity(true); if (homeMode) setHomeMode(false);
  if (!sheetWrap.hidden) closeSheet();
  mansionOpen = true; mansionEl.hidden = false; document.body.classList.add('in-mansion');
  mnSel = st.house.cur;
  renderMansion();
  sfx.chirp(); doneTip('decor');
}
function closeMansion() {
  mansionOpen = false; mansionEl.hidden = true; document.body.classList.remove('in-mansion');
  if (!sheetWrap.hidden && (sheetKind === 'house' || sheetKind === 'build' || sheetKind === 'paint')) closeSheet();
  lastStatAt = Date.now(); updateHud(); layout();
}
function enterRoomFromMansion(i) {
  const cur = st.house.cur;
  closeMansion();
  if (i !== cur) switchRoom(i, i > cur ? 1 : -1); else sfx.pop();
}
function tapMansionRoom(i) {
  if (i === mnSel) { enterRoomFromMansion(i); return; }
  mnSel = i; sfx.boop(); renderMansion();
}
function mansionMore() {
  if (mnSel !== st.house.cur) switchRoom(mnSel, 1);
  openHouse();
}
mansionEl.addEventListener('click', e => {
  if (!st) return;
  const lot = e.target.closest('[data-lot]');
  if (lot) { sfx.boop(); openBuildSheet(lot.dataset.lot); return; }
  const room = e.target.closest('.mn-room');
  if (room) { tapMansionRoom(+room.dataset.i); return; }
  const act2 = e.target.closest('[data-act]');
  if (act2) { if (act2.dataset.act === 'enter') enterRoomFromMansion(mnSel); else if (act2.dataset.act === 'deco') { const i = mnSel, cur = st.house.cur; closeMansion(); if (i !== cur) switchRoom(i, i > cur ? 1 : -1); enterDecor(); } else mansionMore(); return; }
  if (e.target.closest('#mnBack')) { sfx.boop(); closeMansion(); return; }
  if (e.target.closest('#mnPaint')) { sfx.boop(); openPaintSheet(); return; }
  if (e.target.closest('#mnBuild')) { sfx.boop(); openBuildSheet('any'); return; }
});
mansionEl.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mn-room')) { e.preventDefault(); tapMansionRoom(+e.target.dataset.i); } });
window.addEventListener('resize', () => { if (mansionOpen) renderMansion(); });

/* the build sheet: which rooms you can add on an indoor floor or a ground lot */
function openBuildSheet(kind) {
  const full = st.house.rooms.length >= MAX_ROOMS;
  const types = ROOM_ORDER.filter(k => kind === 'any' ? true : kind === 'ground' ? ROOM_TYPES[k].outdoor : !ROOM_TYPES[k].outdoor);
  const build = types.map(k => { const B2 = ROOM_TYPES[k]; return `<button class="build-card" type="button" data-go="room-build" data-type="${k}"${full ? ' disabled' : ''}><span class="bc-ic">${ICON[B2.icon]}</span><b>${B2.name}</b><small>${esc(B2.fn)}</small>${priceHTML(B2.price)}</button>`; }).join('');
  openSheet('build', `
    <p class="eyebrow">${kind === 'ground' ? 'Ground lot' : kind === 'indoor' ? 'Empty floor' : 'Your mansion'}</p><h2 class="title" id="sheetTitle">Build a room</h2>
    <p class="note">${kind === 'ground' ? 'Gardens and farms go on the ground beside the house.' : 'Indoor rooms stack two to a floor, from the ground up.'} New rooms come with a few starter pieces. You have <b>${fmtNum(st.coins)}</b> coins.</p>
    <div class="build-grid">${build}</div>
    <p class="note">${full ? `Your mansion is complete (${MAX_ROOMS} rooms). Remove a room to build another.` : `Up to ${MAX_ROOMS} rooms.`}</p>`);
}
/* the paint sheet: outside colours and the house name */
function openPaintSheet() {
  const sw = (list, go, cur) => list.map(p => `<button class="swatch${p.id === cur ? ' on' : ''}" type="button" data-go="${go}" data-id="${p.id}" style="--c:${p.c}" aria-label="${p.name}"${p.id === cur ? ' aria-pressed="true"' : ''}></button>`).join('');
  openSheet('paint', `
    <p class="eyebrow">Outside</p><h2 class="title" id="sheetTitle">Paint the mansion</h2>
    <h3 class="sec">Walls</h3><div class="swatches">${sw(PAINTS, 'paint', paintOf(st.house).id)}</div>
    <h3 class="sec">Roof</h3><div class="swatches">${sw(ROOFS, 'roof', roofOf(st.house).id)}</div>
    <form class="setting rename" id="houseRenameForm"><label for="houseRenameInput">House name</label><div class="row"><input id="houseRenameInput" type="text" maxlength="18" autocomplete="off" spellcheck="false" value="${esc(st.house.name || '')}" placeholder="${esc(houseName())}"><button class="btn" type="submit">Save</button></div></form>
    <p class="note">Paint is free, and you can change it as often as you like. The name goes on the plaque by the front door.</p>`);
}
function setPaint(kind, id) {
  if (kind === 'paint' && PAINTS.some(p => p.id === id)) st.house.paint = id;
  else if (kind === 'roof' && ROOFS.some(p => p.id === id)) st.house.roof = id;
  else return;
  sfx.boop(); saveSoon(); renderMansion(); openPaintSheet();
}
sheetWrap.addEventListener('submit', e => {
  if (e.target.id !== 'houseRenameForm') return;
  e.preventDefault();
  const v = $('#houseRenameInput').value.replace(/[<>]/g, '').trim().slice(0, 18);
  st.house.name = v; $('#houseRenameInput').blur();
  saveSoon(); renderMansion(); closeSheet();
  toast(v ? `Named ${v}` : 'Back to the default name');
});
