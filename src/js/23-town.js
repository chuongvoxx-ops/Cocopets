/* ---------- Pocket Town: the explorable village on the Adventure screen ----------
   Your pet walks the town (tap to go, or arrows/WASD) with the party trailing behind. Each mini-game has its own
   building: walk up to the door or tap it to pick a stage. The merchants and townsfolk are original characters with
   their own stalls: the egg summoner, the treasure merchant, the crystal smith, the pearl diver, the elder, and the
   gate sentinel who watches the road east to the Tower of Oblivion. */
const TOWN = { W: 1560, H: 1140 };
const TOWN_BUILDINGS = [
  { w: 1, key: 'flappy', title: 'Cloudpuff Hangar', x: 150, y: 250, bw: 220, bh: 150, wall: '#DCEBFF', trim: '#7FB6E8', roof: '#4F8FD6', style: 'hangar', door: [260, 405] },
  { w: 2, key: 'maze', title: 'Hedgemaze Garden', x: 470, y: 190, bw: 240, bh: 170, wall: '#3E8F4E', trim: '#2E6B3A', roof: '#5DB36E', style: 'hedge', door: [590, 365] },
  { w: 3, key: 'shooter', title: 'Starfall Observatory', x: 820, y: 170, bw: 210, bh: 180, wall: '#4E3F8F', trim: '#2B2456', roof: '#8C7BE0', style: 'dome', door: [925, 355] },
  { w: 4, key: 'blocks', title: 'Geode Mine', x: 1180, y: 230, bw: 230, bh: 160, wall: '#6B6478', trim: '#4A4458', roof: '#8F86A3', style: 'mine', door: [1295, 395] },
  { w: 5, key: 'sling', title: 'Boulder Bluffs Range', x: 150, y: 760, bw: 230, bh: 130, wall: '#F2C98A', trim: '#B5803F', roof: '#D9483B', style: 'tent', door: [265, 895] },
  { w: 6, key: 'platform', title: 'Hopscotch Gym', x: 1170, y: 760, bw: 240, bh: 140, wall: '#FFE9A8', trim: '#E07A3F', roof: '#6CC15A', style: 'gym', door: [1290, 905] },
];
const TOWN_NPCS = [
  { id: 'ova', name: 'Madame Ova', role: 'Egg summoner', kind: 'owl', x: 560, y: 560, stall: 'eggs', lines: ['Every egg is a little universe, dear. Shall we crack one open?', 'Ten eggs for a thousand crystals. The five-star ones glow before they hatch, you know.', 'I once hatched a pet that sneezed snowflakes. Lovely creature.'], act: [['summon', 'Summon eggs'], ['crystals', 'Get crystals']] },
  { id: 'pockets', name: 'Pockets', role: 'Treasure merchant', kind: 'raccoon', x: 1000, y: 580, stall: 'treasure', lines: ['Psst. Treasure boxes. A thousand crystals in every one, plus cards, gems, the works.', 'Found this chest in the Tower. Finders keepers, sellers... also keepers.', 'A legendary card is guaranteed every ten boxes. I keep count so you don\'t have to.'], act: [['gift', 'Treasure box'], ['cards', 'Ability cards']] },
  { id: 'glim', name: 'Glim', role: 'Crystal smith', kind: 'mole', x: 1240, y: 600, stall: 'forge', lines: ['Crystals in, Fusion Stones out. Two pets become one, and the one is stronger.', 'Evolution takes five hundred crystals now. Inflation. Don\'t look at me.', 'I can\'t see much up here, but I can hear a five-star pet from across the plaza.'], act: [['fusion', 'Fusion lab'], ['crystals', 'Crystal shop']] },
  { id: 'marina', name: 'Marina', role: 'Pearl diver', kind: 'frog', x: 250, y: 600, stall: 'pearls', lines: ['Ribbit. Pearls from the deep. Earn them by playing, or buy a pouch if you\'re in a hurry.', 'Five hundred pearls buys a treasure box. Three hundred, an egg.', 'The river goes all the way to the Tower moat. I\'ve never swum that far. Yet.'], act: [['pearls', 'Pearl pouch']] },
  { id: 'moss', name: 'Grandpa Moss', role: 'Town elder', kind: 'tortoise', x: 780, y: 700, lines: ['Welcome to Pocket Town, young one. Six games, six doors. Stars open the far ones.', 'Elements, child. Fire melts frost, water quenches fire, and light and dark make an eclipse. Break the scenery and see what it leaves behind.', 'The Tower has a hundred floors. Every tenth one, a Super Fiend. I climbed to floor three once.', 'Your party fights together. Switch pets mid-battle; the bench still earns its keep.', 'Beyond the hills? Nobody knows yet. The map ends where the shadows start.'], act: [] },
  { id: 'sentinel', name: 'The Sentinel', role: 'Gate keeper', kind: 'golem', x: 1400, y: 560, lines: ['Beyond this gate lies the Tower of Oblivion. One hundred floors. Ten fiends. Are you ready?', 'The Tower remembers your best floor. Go back for better grades whenever you like.'], act: [['tower', 'Enter the Tower']] },
];
const TOWN_TREES = [[60, 180], [1500, 160], [120, 520], [1470, 760], [60, 980], [1510, 1000], [700, 90], [1080, 100], [430, 1020], [1060, 1030], [20, 760], [1540, 340], [390, 560], [1140, 560]];
const TOWN_LAMPS = [[440, 470], [1120, 470], [440, 820], [1120, 820], [780, 420], [780, 980]];
const TOWN_PLAZA = { x: 780, y: 650, rx: 380, ry: 260 };
const TOWN_GATE = { x: 1470, y: 520 };
let town = null;
const townWrap = $('#townWrap'), townCv = $('#townCv'), townC = townCv.getContext('2d'), townUi = $('#townUi');
function townBlockers() {
  const B = TOWN_BUILDINGS.map(b => ({ x: b.x, y: b.y + b.bh * 0.35, w: b.bw, h: b.bh * 0.65, door: b.door }));
  B.push({ x: TOWN_PLAZA.x - 50, y: TOWN_PLAZA.y - 34, w: 100, h: 60 }); // the fountain
  B.push({ x: 620, y: 960, w: 150, h: 96 }); // the vegetable garden
  TOWN_TREES.forEach(([x, y]) => B.push({ x: x - 16, y: y - 10, w: 32, h: 20 }));
  TOWN_NPCS.forEach(n => { if (n.stall) B.push({ x: n.x - 60, y: n.y - 60, w: 120, h: 44 }); });
  return B;
}
function townSpritesFor(p) {
  const key = p.uid || 'me';
  if (town.sprites.has(key)) return town.sprites.get(key);
  town.sprites.set(key, null);
  loadSprites(formOf(p)).then(S => { if (town) town.sprites.set(key, S); });
  return null;
}
function openTown() {
  if (!town) {
    town = { t: 0, last: 0, raf: 0, pet: { x: TOWN_PLAZA.x, y: TOWN_PLAZA.y + 120, vx: 0, vy: 0, face: 1, walk: 0, bob: 0 }, goal: null, pending: null, cam: { x: 0, y: 0 }, sprites: new Map(), keys: {}, near: null, lastNear: null, dust: [], followers: [], blockers: townBlockers(), talkIdx: {}, ground: null, hint: 0 };
    if (st && st.town && st.town.x) { town.pet.x = st.town.x; town.pet.y = st.town.y; }
    const party = partyPets();
    town.followers = party.slice(1).map((p, i) => ({ p, x: town.pet.x - 40 * (i + 1), y: town.pet.y + 10 * (i + 1), face: 1, walk: 0, bob: 0 }));
    townSpritesFor(st); town.followers.forEach(f => townSpritesFor(f.p));
  }
  townLayout();
  town.last = 0;
  cancelAnimationFrame(town.raf);
  town.raf = requestAnimationFrame(townFrame);
  townHint();
}
function closeTown() {
  if (!town) return;
  cancelAnimationFrame(town.raf); town.raf = 0;
  if (st) { st.town = st.town || {}; st.town.x = town.pet.x; st.town.y = town.pet.y; }
}
function townLayout() {
  const r = townWrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  town.W = Math.max(200, Math.round(r.width)); town.H = Math.max(200, Math.round(r.height)); town.dpr = dpr;
  townCv.width = Math.round(town.W * dpr); townCv.height = Math.round(town.H * dpr);
  townCv.style.width = town.W + 'px'; townCv.style.height = town.H + 'px';
  town.zoom = clamp(town.W / 420, 0.85, 1.25);
}
function townFrame(ts) {
  if (!town || !mapOpen || mapTab !== 'town') return;
  const dt = Math.min(0.05, town.last ? (ts - town.last) / 1000 : 0.016); town.last = ts; town.t += dt;
  townUpdate(dt); townDraw();
  town.raf = requestAnimationFrame(townFrame);
}
/* ---- movement ---- */
function townBlocked(x, y) {
  if (x < 24 || x > TOWN.W - 24 || y < 120 || y > TOWN.H - 30) return true;
  for (const b of town.blockers) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  return false;
}
function townMove(e, dx, dy) {
  if (!townBlocked(e.x + dx, e.y + dy)) { e.x += dx; e.y += dy; return true; }
  if (!townBlocked(e.x + dx, e.y)) { e.x += dx; return true; }
  if (!townBlocked(e.x, e.y + dy)) { e.y += dy; return true; }
  return false;
}
/* the on-screen controls: a stick under the left thumb, Dash / Jump / Emote under the right (screen space) */
const TOWN_BOT = 52, TOWN_STICK_R = 48;
const townStickHome = () => ({ x: 76, y: town.H - TOWN_BOT - 70 });
const townBtns = () => ({ dash: { x: town.W - 60, y: town.H - TOWN_BOT - 48, r: 36, label: 'DASH' }, jump: { x: town.W - 136, y: town.H - TOWN_BOT - 86, r: 28, label: 'JUMP' }, emote: { x: town.W - 48, y: town.H - TOWN_BOT - 140, r: 26, label: 'EMOTE' } });
const TOWN_EMOTES = ['heart', 'note', 'star', 'zzz', 'bang'];
function townDash() { if (town.dashCd > 0 || town.dashT > 0) return; town.dashT = 0.32; town.dashCd = 0.9; sfx.whoosh && sfx.whoosh(); for (let i = 0; i < 6; i++) town.dust.push({ x: town.pet.x + (Math.random() - 0.5) * 16, y: town.pet.y + (Math.random() - 0.5) * 6, life: 0.5, max: 0.5 }); }
function townJump() { if (town.pet.z > 0) return; town.pet.zv = 320; sfx.boop(); }
function townEmote() { town.emoteI = ((town.emoteI || 0) + 1) % TOWN_EMOTES.length; town.emote = { kind: TOWN_EMOTES[town.emoteI], t: 1.6 }; sfx.chirp(); town.followers.forEach((f, i) => setTimeout(() => { if (town) f.emote = { kind: TOWN_EMOTES[town.emoteI], t: 1.4 }; }, 150 + i * 120)); }
function townStickVec() { const S = town.stick; if (!S || S.id == null) return null; const dx = S.x - S.ox, dy = S.y - S.oy, d = Math.hypot(dx, dy), dz = TOWN_STICK_R * 0.14; if (d < dz) return [0, 0]; const k = Math.min(1, (d - dz) / (TOWN_STICK_R * 0.7)); return [dx / d * k, dy / d * k]; }
function townUpdate(dt) {
  const P = town.pet, K = town.keys, spd = 230 * (town.dashT > 0 ? 2.3 : 1);
  town.dashT = Math.max(0, (town.dashT || 0) - dt); town.dashCd = Math.max(0, (town.dashCd || 0) - dt);
  if (P.zv || P.z) { P.zv = (P.zv || 0) - 900 * dt; P.z = Math.max(0, (P.z || 0) + P.zv * dt); if (P.z === 0 && P.zv < 0) { P.zv = 0; town.dust.push({ x: P.x - 8, y: P.y, life: 0.4, max: 0.4 }); town.dust.push({ x: P.x + 8, y: P.y, life: 0.4, max: 0.4 }); } }
  if (town.emote) { town.emote.t -= dt; if (town.emote.t <= 0) town.emote = null; }
  town.followers.forEach(f => { if (f.emote) { f.emote.t -= dt; if (f.emote.t <= 0) f.emote = null; } });
  let mx = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0), my = (K.ArrowDown || K.s ? 1 : 0) - (K.ArrowUp || K.w ? 1 : 0);
  const sv = townStickVec(); if (sv && (sv[0] || sv[1])) { mx = sv[0]; my = sv[1]; }
  if (mx || my) { town.goal = null; town.pending = null; const n = Math.hypot(mx, my); if (n > 1) { mx /= n; my /= n; } }
  else if (town.goal) {
    const dx = town.goal.x - P.x, dy = town.goal.y - P.y, d = Math.hypot(dx, dy);
    if (d < 6) { P.x = town.goal.x; P.y = town.goal.y; town.goal = null; townArrive(); }
    else { mx = dx / d; my = dy / d; if (d < 40) { mx *= d / 40 + 0.3; my *= d / 40 + 0.3; } }
  }
  if (mx || my) {
    const moved = townMove(P, mx * spd * dt, my * spd * dt);
    if (!moved && town.goal) { town.goal = null; townArrive(); }
    if (Math.abs(mx) > 0.2) P.face = mx > 0 ? 1 : -1;
    if (town.dashT > 0 && Math.random() < dt * 30) town.dust.push({ x: P.x - P.face * 10, y: P.y, life: 0.45, max: 0.45 });
    P.walk += dt * 11; P.bob = Math.abs(Math.sin(P.walk)) * 5;
    if (Math.random() < dt * 8) town.dust.push({ x: P.x - P.face * 8, y: P.y, life: 0.5, max: 0.5 });
  } else { P.walk = 0; P.bob *= 0.8; }
  // the party trails behind
  let lead = P;
  for (const f of town.followers) {
    const dx = lead.x - f.x, dy = lead.y - f.y, d = Math.hypot(dx, dy);
    if (d > 46) { const k = Math.min(1, (d - 46) / 30) * spd * dt; townMove(f, dx / d * k, dy / d * k); f.face = dx > 0 ? 1 : -1; f.walk += dt * 11; f.bob = Math.abs(Math.sin(f.walk)) * 5; } else { f.bob *= 0.8; }
    lead = f;
  }
  for (let i = town.dust.length - 1; i >= 0; i--) { town.dust[i].life -= dt; if (town.dust[i].life <= 0) town.dust.splice(i, 1); }
  // camera
  const Z = town.zoom, vw = town.W / Z, vh = town.H / Z;
  const cx = clamp(P.x - vw / 2, 0, TOWN.W - vw), cy = clamp(P.y - 40 - vh / 2, 0, TOWN.H - vh);
  town.cam.x += (cx - town.cam.x) * Math.min(1, dt * 6); town.cam.y += (cy - town.cam.y) * Math.min(1, dt * 6);
  // what is close enough to talk to / enter
  let near = null, bd = 1e9;
  TOWN_NPCS.forEach(n => { const d = Math.hypot(n.x - P.x, n.y - P.y); if (d < 70 && d < bd) { bd = d; near = { kind: 'npc', n }; } });
  TOWN_BUILDINGS.forEach(b => { const d = Math.hypot(b.door[0] - P.x, b.door[1] - P.y); if (d < 50 && d < bd) { bd = d; near = { kind: 'building', b }; } });
  if (Math.hypot(TOWN_GATE.x - P.x, TOWN_GATE.y - P.y) < 60 && bd > 60) near = { kind: 'gate' };
  town.near = near;
  if (near && (!town.lastNear || near.kind !== town.lastNear.kind || near.n !== town.lastNear.n || near.b !== town.lastNear.b)) townHint();
  if (!near && town.lastNear) townHint();
  town.lastNear = near;
}
function townArrive() {
  const p = town.pending; town.pending = null;
  if (!p) return;
  if (p.kind === 'npc') townTalk(p.n);
  else if (p.kind === 'building') townBuildingCard(p.b);
  else if (p.kind === 'gate') townGateCard();
}
function townHint() {
  const n = town.near;
  let html = '';
  if (n && n.kind === 'npc') html = `<button class="town-hint" type="button" data-tn="talk">${ICON.heart}Talk to ${esc(n.n.name)}</button>`;
  else if (n && n.kind === 'building') html = `<button class="town-hint" type="button" data-tn="enter">${ICON.play}Enter ${esc(n.b.title)}</button>`;
  else if (n && n.kind === 'gate') html = `<button class="town-hint" type="button" data-tn="gate">${ICON.sword}To the Tower</button>`;
  else if (!(st.town && st.town.walked)) html = `<span class="town-hint soft">Tap anywhere to walk. Tap a building or a townsperson to visit.</span>`;
  townUi.innerHTML = html;
}
/* ---- input ---- */
function townWorld(ev) {
  const r = townCv.getBoundingClientRect(), Z = town.zoom;
  return { x: (ev.clientX - r.left) / Z + town.cam.x, y: (ev.clientY - r.top) / Z + town.cam.y };
}
townCv.addEventListener('pointerdown', ev => {
  if (!town) return;
  sfx.unlock();
  const r = townCv.getBoundingClientRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
  // the right-hand buttons
  const B = townBtns(); for (const k in B) { const b = B[k]; if (Math.hypot(sx - b.x, sy - b.y) < b.r + 8) { if (k === 'dash') townDash(); else if (k === 'jump') townJump(); else townEmote(); town.btnFlash = { k, t: 0.2 }; return; } }
  // the stick zone: the lower left, under the thumb
  const hm = townStickHome(); if (Math.hypot(sx - hm.x, sy - hm.y) < 120 && (town.stick == null || town.stick.id == null)) { town.stick = { id: ev.pointerId, ox: sx, oy: sy, x: sx, y: sy }; try { townCv.setPointerCapture(ev.pointerId); } catch (e) {} town.goal = null; town.pending = null; st.town = st.town || {}; st.town.walked = true; return; }
  const w = townWorld(ev);
  st.town = st.town || {}; st.town.walked = true;
  // a townsperson?
  for (const n of TOWN_NPCS) if (Math.hypot(n.x - w.x, n.y - (w.y + 30)) < 44 || (n.stall && Math.abs(n.x - w.x) < 64 && w.y > n.y - 110 && w.y < n.y + 10)) { townGoTo(n.x + (town.pet.x < n.x ? -46 : 46), n.y + 8, { kind: 'npc', n }); return; }
  // a building?
  for (const b of TOWN_BUILDINGS) if (w.x > b.x - 10 && w.x < b.x + b.bw + 10 && w.y > b.y - 120 && w.y < b.y + b.bh + 10) { townGoTo(b.door[0], b.door[1] + 14, { kind: 'building', b }); return; }
  if (Math.hypot(TOWN_GATE.x - w.x, TOWN_GATE.y - w.y) < 70) { townGoTo(TOWN_GATE.x - 50, TOWN_GATE.y + 10, { kind: 'gate' }); return; }
  townGoTo(w.x, w.y, null);
});
townCv.addEventListener('pointermove', ev => { if (!town || !town.stick || town.stick.id !== ev.pointerId) return; const r = townCv.getBoundingClientRect(); town.stick.x = ev.clientX - r.left; town.stick.y = ev.clientY - r.top; });
const townStickEnd = ev => { if (town && town.stick && town.stick.id === ev.pointerId) town.stick = null; };
townCv.addEventListener('pointerup', townStickEnd); townCv.addEventListener('pointercancel', townStickEnd);
window.addEventListener('resize', () => { if (town && mapOpen && mapTab === 'town') townLayout(); });
function townGoTo(x, y, pending) {
  town.goal = { x: clamp(x, 30, TOWN.W - 30), y: clamp(y, 130, TOWN.H - 40) }; town.pending = pending;
  town.ping = { x: town.goal.x, y: town.goal.y, t: 0 };
  if (!mapCard.hidden && !mapSel) mapCard.hidden = true;
}
document.addEventListener('keydown', e => { if (!town || !mapOpen || mapTab !== 'town' || !sheetWrap.hidden) return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(e.key)) { town.keys[e.key] = true; e.preventDefault(); } if (e.key === 'Shift') townDash(); else if (e.key === ' ') { townJump(); e.preventDefault(); } else if (e.key === 'e' || e.key === 'E') townEmote(); else if (e.key === 'Enter') { const n = town.near; if (n) { if (n.kind === 'npc') townTalk(n.n); else if (n.kind === 'building') townBuildingCard(n.b); else townGateCard(); e.preventDefault(); } } });
document.addEventListener('keyup', e => { if (town) town.keys[e.key] = false; });
townUi.addEventListener('click', e => {
  const b = e.target.closest('[data-tn]'); if (!b || !town) return;
  sfx.unlock();
  const n = town.near; if (!n) return;
  if (b.dataset.tn === 'talk') townTalk(n.n); else if (b.dataset.tn === 'enter') townBuildingCard(n.b); else townGateCard();
});
/* ---- cards: talking, buildings, the gate ---- */
function townTalk(n) {
  const i = (town.talkIdx[n.id] || 0) % n.lines.length; town.talkIdx[n.id] = i + 1;
  const acts = n.act.map(([k, label]) => `<button class="btn${k === 'tower' || k === 'summon' ? ' primary' : ''}" type="button" data-tc="${k}">${label}</button>`).join('');
  mapSel = null;
  mapCard.innerHTML = `<div class="mc-head town-head"><canvas class="npc-face" width="96" height="96" data-npc="${n.id}"></canvas><div><p class="eyebrow">${esc(n.role)}</p><h2>${esc(n.name)}</h2></div><button class="icon-btn" type="button" data-mc="close" aria-label="Close">${ICON.close}</button></div>
    <p class="mc-goal town-line">"${esc(n.lines[i])}"</p>
    <div class="mc-row town-acts">${acts}<button class="btn" type="button" data-mc="close">${n.lines.length > 1 ? 'Goodbye' : 'OK'}</button></div>`;
  mapCard.hidden = false;
  const cv = $('.npc-face', mapCard); if (cv) { const c = cv.getContext('2d'), sp = TownArt.npc(n.kind, false); c.drawImage(sp.cv, 0, 0, sp.cv.width, sp.cv.height, -8, 4, 112, 122); }
  sfx.boop();
}
function townBuildingCard(b) {
  const W = WORLDS[b.w - 1], open = worldOpen(W.id), got = W.stages.reduce((a, _, j) => a + (st.map.stars[skey(W.id, j + 1)] || 0), 0);
  mapSel = null;
  const stages = W.stages.map((S, j) => { const s = j + 1, k = skey(W.id, s), sv = st.map.stars[k] || 0, ok = stageOpen(W.id, s), boss = s === W.stages.length; return `<button class="tstage${ok ? '' : ' locked'}${sv ? ' done' : ''}${boss ? ' boss' : ''}" type="button" data-ts="${s}" ${ok ? '' : 'aria-disabled="true"'}><b>${W.id}-${s}</b><span>${esc(S.name)}</span><small class="nst">${[1, 2, 3].map(n => `<i class="${n <= sv ? 'on' : ''}"></i>`).join('')}</small>${ok ? '' : ICON.lock}</button>`; }).join('');
  mapCard.innerHTML = `<div class="mc-head"><div><p class="eyebrow">${esc(b.title)} · ${esc(W.name)}</p><h2>${esc(W.game)}</h2></div><span class="nst big"><b class="mono">${got}/${W.stages.length * 3} ★</b></span><button class="icon-btn" type="button" data-mc="close" aria-label="Close">${ICON.close}</button></div>
    <p class="note">${esc(W.how)}</p>
    ${open ? `<div class="tstages" data-w="${W.id}">${stages}</div>` : `<p class="mc-lock">${ICON.lock}Collect ${W.gate} stars to open ${esc(W.name)}. You have ${totalStars()}.</p>`}`;
  mapCard.hidden = false; sfx.boop();
}
function townGateCard() {
  mapSel = null;
  mapCard.innerHTML = `<div class="mc-head"><div><p class="eyebrow">East gate</p><h2>Tower of Oblivion</h2></div><button class="icon-btn" type="button" data-mc="close" aria-label="Close">${ICON.close}</button></div>
    <p class="mc-goal">One hundred floors above the clouds. Your best so far: floor ${st.dun.best || 0}.</p>
    <div class="mc-row"><button class="btn primary" type="button" data-tc="tower">${ICON.sword}Enter the Tower</button><button class="btn" type="button" data-mc="close">Not yet</button></div>`;
  mapCard.hidden = false; sfx.boop();
}
mapCard.addEventListener('click', e => {
  const ts = e.target.closest('.tstage'); if (ts && !ts.classList.contains('locked')) { const w = +ts.closest('.tstages').dataset.w; selectStage(w, +ts.dataset.ts); return; }
  const b = e.target.closest('[data-tc]'); if (!b) return;
  const k = b.dataset.tc; sfx.unlock();
  if (k === 'tower') { mapCard.hidden = true; setMapTab('dungeon'); return; }
  mapCard.hidden = true;
  if (k === 'summon') openSummon(); else if (k === 'gift') openGiftShop(); else if (k === 'crystals') openCrystalShop(); else if (k === 'fusion') openFusion(); else if (k === 'pearls') openPearlShop(); else if (k === 'cards') openCards(cardsSlot);
});
/* ---- drawing ---- */
const TOWN_BEDS = [[TOWN_PLAZA.x - 300, TOWN_PLAZA.y + 200, 60, 22], [TOWN_PLAZA.x + 300, TOWN_PLAZA.y + 200, 60, 22], [TOWN_PLAZA.x, TOWN_PLAZA.y - 230, 80, 22], [330, 1000, 50, 18], [1080, 1000, 50, 18]];
const TOWN_GARDEN = [620, 960, 150, 96];
const TOWN_BUNTING = [[[440, 470], [780, 420]], [[780, 420], [1120, 470]], [[440, 820], [780, 980]], [[780, 980], [1120, 820]]];
function townGround() { if (!town.ground) town.ground = TownArt.ground(TOWN, TOWN_PLAZA, TOWN_GATE, TOWN_BUILDINGS, TOWN_BEDS, TOWN_GARDEN); return town.ground; }
function townDraw() {
  const c = townC, Z = town.zoom * town.dpr, W = town.W, H = town.H, t = town.t, t0 = performance.now();
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, townCv.width, townCv.height);
  c.setTransform(Z, 0, 0, Z, -town.cam.x * Z, -town.cam.y * Z);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const G = townGround(); c.drawImage(G, 0, 0, TOWN.W, TOWN.H);
  // ping where you tapped, footprints of dust
  if (town.ping) { town.ping.t += 0.016; const u = town.ping.t / 0.6; if (u < 1) { c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 2; c.beginPath(); c.ellipse(town.ping.x, town.ping.y, 8 + u * 18, 4 + u * 9, 0, 0, 6.283); c.stroke(); } else town.ping = null; }
  for (const d of town.dust) { c.fillStyle = `rgba(230,220,190,${d.life / d.max * 0.6})`; c.beginPath(); c.arc(d.x, d.y, 3 + (1 - d.life / d.max) * 5, 0, 6.283); c.fill(); }
  // everything with a foot line, sorted back to front
  const ents = [];
  TOWN_BUILDINGS.forEach(b => ents.push([b.y + b.bh, () => drawBuilding(c, b, t)]));
  TOWN_TREES.forEach(([x, y], i) => ents.push([y, () => drawTree(c, x, y, t, i)]));
  TOWN_LAMPS.forEach(([x, y]) => ents.push([y, () => drawLamp(c, x, y, t)]));
  ents.push([TOWN_PLAZA.y + 26, () => drawFountain(c, TOWN_PLAZA.x, TOWN_PLAZA.y, t)]);
  ents.push([TOWN_GATE.y + 10, () => drawGate(c, TOWN_GATE.x, TOWN_GATE.y, t)]);
  TOWN_NPCS.forEach(n => { if (n.stall) ents.push([n.y - 30, () => drawStall(c, n, t)]); ents.push([n.y, () => drawNpc(c, n, t, town.pet.x < n.x ? -1 : 1)]); });
  town.followers.forEach(f => ents.push([f.y, () => drawTownPet(c, f.p, f)]));
  ents.push([town.pet.y, () => drawTownPet(c, st, town.pet, true)]);
  ents.sort((a, b) => a[0] - b[0]);
  for (const e of ents) e[1]();
  drawBunting(c, t);
  // light: one sun, high and to the upper left. Warm key light falls across the scene, shadow sides cool toward
  // sky blue, a soft glare sits where the sun is, and the far corner of the view darkens a touch.
  const h = town.hour != null ? town.hour : new Date().getHours(), night = h >= 19 || h < 6, dusk = !night && (h >= 17 || h < 8);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const CW = townCv.width, CHh = townCv.height;
  if (!night) {
    const key = c.createLinearGradient(0, 0, CW, CHh); key.addColorStop(0, dusk ? 'rgba(255,190,120,.40)' : 'rgba(255,240,200,.34)'); key.addColorStop(0.55, 'rgba(255,255,255,0)'); key.addColorStop(1, dusk ? 'rgba(90,70,160,.30)' : 'rgba(110,140,210,.22)');
    c.globalCompositeOperation = 'soft-light'; c.fillStyle = key; c.fillRect(0, 0, CW, CHh); c.fillRect(0, 0, CW, CHh);
    const glare = c.createRadialGradient(CW * 0.12, CHh * 0.08, 0, CW * 0.12, CHh * 0.08, Math.max(CW, CHh) * 0.7); glare.addColorStop(0, dusk ? 'rgba(255,200,130,.30)' : 'rgba(255,250,225,.22)'); glare.addColorStop(0.4, dusk ? 'rgba(255,200,130,.08)' : 'rgba(255,250,225,.06)'); glare.addColorStop(1, 'rgba(255,250,225,0)');
    c.globalCompositeOperation = 'screen'; c.fillStyle = glare; c.fillRect(0, 0, CW, CHh);
    if (dusk) { c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(255,200,160,.9)'; c.fillRect(0, 0, CW, CHh); }
  } else { c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(70,80,160,.85)'; c.fillRect(0, 0, CW, CHh); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(10,8,40,.22)'; c.fillRect(0, 0, CW, CHh); }
  c.restore();
  if (night) { c.save(); c.globalCompositeOperation = 'lighter'; TOWN_LAMPS.forEach(([x, y]) => { const g = c.createRadialGradient(x, y - 100, 0, x, y - 100, 150); g.addColorStop(0, 'rgba(255,215,130,.55)'); g.addColorStop(0.3, 'rgba(255,190,100,.22)'); g.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = g; c.fillRect(x - 150, y - 250, 300, 300); }); TOWN_BUILDINGS.forEach(b => { if (!worldOpen(b.w)) return; const g = c.createRadialGradient(b.x + b.bw / 2, b.y + b.bh * 0.5, 10, b.x + b.bw / 2, b.y + b.bh * 0.5, b.bw * 0.7); g.addColorStop(0, 'rgba(255,200,120,.22)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(b.x - 60, b.y - 80, b.bw + 120, b.bh + 160); }); for (let i = 0; i < 28; i++) { const x = (i * 263) % TOWN.W, y = 200 + (i * 157) % (TOWN.H - 300) + Math.sin(t + i) * 8; c.fillStyle = `rgba(200,255,150,${0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`; c.beginPath(); c.arc(x, y, 2.5, 0, 6.283); c.fill(); } c.restore(); }
  // tilt-shift: the top and bottom of the view soften, like a diorama (skipped on slow devices)
  if (town.q !== 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const bh = Math.round(townCv.height * 0.18);
    if (!town.blurCv || town.blurCv.width !== townCv.width) { town.blurCv = document.createElement('canvas'); town.blurCv.width = townCv.width; town.blurCv.height = townCv.height; }
    const bc = town.blurCv.getContext('2d'); bc.clearRect(0, 0, townCv.width, townCv.height); bc.filter = 'blur(3px)'; bc.drawImage(townCv, 0, 0); bc.filter = 'none';
    [[0, 0, 0, bh, 0, bh], [0, townCv.height - bh, 0, townCv.height, townCv.height - bh, townCv.height]].forEach(([x, y, gy0, gy1, cy0, cy1], i) => { const g = c.createLinearGradient(0, gy0, 0, gy1); g.addColorStop(0, i ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'); g.addColorStop(1, i ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); const m = document.createElement('canvas'); m.width = townCv.width; m.height = bh; const mc = m.getContext('2d'); mc.drawImage(town.blurCv, 0, cy0, townCv.width, bh, 0, 0, townCv.width, bh); mc.globalCompositeOperation = 'destination-in'; const g2 = mc.createLinearGradient(0, 0, 0, bh); g2.addColorStop(0, i ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'); g2.addColorStop(1, i ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); mc.fillStyle = g2; mc.fillRect(0, 0, townCv.width, bh); c.drawImage(m, 0, cy0); });
    c.restore();
  }
  // the dark beyond the edges: lands to come
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const vg = c.createRadialGradient(townCv.width / 2, townCv.height / 2, Math.min(townCv.width, townCv.height) * 0.45, townCv.width / 2, townCv.height / 2, Math.max(townCv.width, townCv.height) * 0.78);
  vg.addColorStop(0, 'rgba(10,8,30,0)'); vg.addColorStop(1, 'rgba(10,8,30,.5)'); c.fillStyle = vg; c.fillRect(0, 0, townCv.width, townCv.height);
  c.restore();
  drawTownControls(c);
  // adaptive quality: drop the tilt-shift if frames run long
  const ms = performance.now() - t0; town.msAvg = town.msAvg == null ? ms : town.msAvg * 0.9 + ms * 0.1; if (town.q !== 0 && town.msAvg > 26 && town.t > 2) town.q = 0;
}
function drawTownControls(c) {
  c.save(); c.setTransform(town.dpr, 0, 0, town.dpr, 0, 0); c.font = '800 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const label = (x, y, s) => { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(s, x, y); c.fillStyle = '#FFFDF8'; c.fillText(s, x, y); };
  // the stick
  const S = town.stick, home = townStickHome(), bx = S ? S.ox : home.x, by = S ? S.oy : home.y;
  c.globalAlpha = S ? 0.9 : 0.55; c.fillStyle = 'rgba(20,16,40,.55)'; c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2.5; c.beginPath(); c.arc(bx, by, TOWN_STICK_R, 0, 6.283); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(bx + dx * (TOWN_STICK_R - 10) + dy * 5, by + dy * (TOWN_STICK_R - 10) + dx * 5); c.lineTo(bx + dx * (TOWN_STICK_R - 4), by + dy * (TOWN_STICK_R - 4)); c.lineTo(bx + dx * (TOWN_STICK_R - 10) - dy * 5, by + dy * (TOWN_STICK_R - 10) - dx * 5); c.fill(); });
  let kx = bx, ky = by; if (S) { const dx = S.x - S.ox, dy = S.y - S.oy, d = Math.hypot(dx, dy), m = Math.min(d, TOWN_STICK_R * 0.7); if (d > 0) { kx = bx + dx / d * m; ky = by + dy / d * m; } }
  const kg = c.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, 24); kg.addColorStop(0, 'rgba(200,190,230,.95)'); kg.addColorStop(1, 'rgba(90,80,130,.95)'); c.fillStyle = kg; c.beginPath(); c.arc(kx, ky, 24, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.stroke();
  c.globalAlpha = 0.9; label(bx, by + TOWN_STICK_R + 14, 'MOVE');
  // the buttons
  const B = townBtns(), cols = { dash: ['#FF9F43', '#FFE37A'], jump: ['#6CC15A', '#E8FFC2'], emote: ['#FF9BD2', '#FFF0F5'] };
  for (const k in B) { const b = B[k], fl = town.btnFlash && town.btnFlash.k === k ? 1 : 0, cd = k === 'dash' ? (town.dashCd || 0) / 0.9 : 0; c.globalAlpha = 0.92; const g = c.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r); g.addColorStop(0, fl ? '#FFFFFF' : cols[k][1]); g.addColorStop(1, cols[k][0]); c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = 3; c.stroke();
    if (cd > 0) { c.fillStyle = 'rgba(20,16,40,.45)'; c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + cd * 6.283); c.closePath(); c.fill(); }
    c.fillStyle = '#2B2433'; c.strokeStyle = '#2B2433'; c.lineWidth = 3; c.lineCap = 'round';
    if (k === 'dash') { c.beginPath(); c.moveTo(b.x - 12, b.y); c.lineTo(b.x + 10, b.y); c.moveTo(b.x + 2, b.y - 8); c.lineTo(b.x + 10, b.y); c.lineTo(b.x + 2, b.y + 8); c.moveTo(b.x - 16, b.y - 7); c.lineTo(b.x - 8, b.y - 7); c.moveTo(b.x - 16, b.y + 7); c.lineTo(b.x - 8, b.y + 7); c.stroke(); }
    else if (k === 'jump') { c.beginPath(); c.moveTo(b.x - 10, b.y + 8); c.quadraticCurveTo(b.x, b.y - 16, b.x + 10, b.y + 8); c.stroke(); c.beginPath(); c.arc(b.x, b.y - 4, 4, 0, 6.283); c.fill(); }
    else { c.beginPath(); c.moveTo(b.x, b.y + 7); c.bezierCurveTo(b.x - 12, b.y - 3, b.x - 8, b.y - 13, b.x, b.y - 6); c.bezierCurveTo(b.x + 8, b.y - 13, b.x + 12, b.y - 3, b.x, b.y + 7); c.fill(); }
    label(b.x, b.y + b.r + 12, b.label); }
  if (town.btnFlash) { town.btnFlash.t -= 0.016; if (town.btnFlash.t <= 0) town.btnFlash = null; }
  c.restore();
}
function drawBunting(c, t) {
  const cols = ['#FF6F59', '#FFE37A', '#7FD3F2', '#6CC15A', '#B983F5', '#FF9BD2'];
  TOWN_BUNTING.forEach(([[x0, y0], [x1, y1]], k) => {
    const ay0 = y0 - 100, ay1 = y1 - 100, sag = 26, n = 14; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, ay0); c.quadraticCurveTo((x0 + x1) / 2, (ay0 + ay1) / 2 + sag * 2, x1, ay1); c.stroke();
    for (let i = 1; i < n; i++) { const u = i / n, px = x0 + (x1 - x0) * u, py = (1 - u) * (1 - u) * ay0 + 2 * (1 - u) * u * ((ay0 + ay1) / 2 + sag * 2) + u * u * ay1, sw = Math.sin(t * 3 + i + k) * 2; c.fillStyle = cols[(i + k) % cols.length]; c.beginPath(); c.moveTo(px - 6, py); c.lineTo(px + 6, py); c.lineTo(px + sw, py + 13); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke(); }
  });
}
function drawEmote(c, x, y, em) {
  const u = 1 - em.t / 1.6, rise = Math.min(1, u * 4) * 10, a = em.t < 0.4 ? em.t / 0.4 : 1; c.save(); c.globalAlpha = a; c.translate(x, y - rise); c.fillStyle = '#FFFDF8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2.5; GFX.rr(c, -16, -30, 32, 30, 10); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-5, 0); c.lineTo(0, 7); c.lineTo(5, 0); c.fill(); c.translate(0, -15); c.scale(1 + 0.08 * Math.sin(em.t * 14), 1 + 0.08 * Math.sin(em.t * 14));
  if (em.kind === 'heart') { c.fillStyle = '#FF6F59'; c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-12, -2, -8, -12, 0, -5); c.bezierCurveTo(8, -12, 12, -2, 0, 8); c.fill(); }
  else if (em.kind === 'note') { c.fillStyle = '#4FA8F0'; c.beginPath(); c.ellipse(-3, 6, 5, 3.5, -0.4, 0, 6.283); c.fill(); c.fillRect(1, -9, 2.5, 15); c.beginPath(); c.moveTo(1, -9); c.quadraticCurveTo(8, -8, 9, -2); c.lineTo(9, 1); c.quadraticCurveTo(8, -5, 3.5, -5); c.fill(); }
  else if (em.kind === 'star') { c.fillStyle = '#FFD447'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 9, aa = -Math.PI / 2 + i * Math.PI / 5; i ? c.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : c.moveTo(Math.cos(aa) * r, Math.sin(aa) * r); } c.closePath(); c.fill(); }
  else if (em.kind === 'zzz') { c.fillStyle = '#8C7BE0'; c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('z', -5, 6); c.font = '800 9px system-ui, sans-serif'; c.fillText('z', 4, -1); c.font = '800 7px system-ui, sans-serif'; c.fillText('z', 9, -7); }
  else { c.fillStyle = '#FF9F43'; c.font = '800 18px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, 7); }
  c.restore();
}
function drawTownPet(c, p, e, me) {
  const S = townSpritesFor(p), h = 54 * (me ? 1 : 0.92), x = e.x, y = e.y - e.bob - (e.z || 0) * 0.5;
  const sh = 1 - Math.min(0.5, (e.z || 0) / 160); c.fillStyle = `rgba(0,0,0,${0.22 * sh})`; c.beginPath(); c.ellipse(e.x, e.y + 2, 18 * sh, 7 * sh, 0, 0, 6.283); c.fill();
  if (me && town.dashT > 0) { c.save(); c.globalAlpha = 0.35; if (S && S.normal && S.normal.img) { const s2 = S.normal, [vx2, vy2, vw2, vh2] = s2.vb, k2 = h / S.bodyTop; for (let g = 1; g <= 2; g++) { c.save(); c.translate(x - e.face * g * 14, y); c.scale(e.face < 0 ? -1 : 1, 1); c.drawImage(s2.img, vx2 * k2, vy2 * k2, vw2 * k2, vh2 * k2); c.restore(); } } c.restore(); }
  if (e.emote) drawEmote(c, x, y - h - 20, e.emote);
  if (S && S.normal && S.normal.img) { const s = S.normal, [vx, vy, vw, vh] = s.vb, k = h / S.bodyTop; c.save(); c.translate(x, y); c.scale(e.face < 0 ? -1 : 1, 1); c.drawImage(s.img, vx * k, vy * k, vw * k, vh * k); c.restore(); }
  else { c.fillStyle = '#FFB0C8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x, y - h / 2, h * 0.4, h / 2, 0, 0, 6.283); c.fill(); c.stroke(); }
  if (me && town.emote) drawEmote(c, x, y - h - 20, town.emote);
  if (me) { c.fillStyle = '#2B2433'; c.font = '800 12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.9)'; GFX.rr(c, x - 30, y - h - 24, 60, 18, 9); c.fill(); c.fillStyle = '#2B2433'; c.fillText(p.name, x, y - h - 11); }
}
function drawTree(c, x, y, t, i) { const sw = Math.sin(t * 1.1 + i) * 0.01; c.save(); c.translate(x, y); c.rotate(sw); TownArt.blit(c, TownArt.tree(i), 0, 0); c.restore(); }
function drawLamp(c, x, y, t) { TownArt.blit(c, TownArt.lamp(), x, y); const h = town.hour != null ? town.hour : new Date().getHours(); if (h >= 18 || h < 7) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,220,140,${0.55 + 0.2 * Math.sin(t * 7 + x)})`; c.beginPath(); c.arc(x, y - 102, 7, 0, 6.283); c.fill(); c.restore(); } }
function drawFountain(c, x, y, t) {
  TownArt.blit(c, TownArt.fountain(), x, y);
  c.save(); c.strokeStyle = 'rgba(210,240,255,.95)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.38, ph = (t * 1.5 + i * 0.2) % 1; c.beginPath(); c.moveTo(x, y - 58); c.quadraticCurveTo(x + Math.cos(a) * 34, y - 86, x + Math.cos(a) * 40, y - 12 + ph * 4); c.stroke(); }
  for (let i = 0; i < 8; i++) { const u = (t * 0.8 + i / 8) % 1; c.fillStyle = `rgba(255,255,255,${0.8 - u * 0.8})`; c.beginPath(); c.arc(x - 38 + i * 11, y - 6 - u * 10, 2.5, 0, 6.283); c.fill(); }
  c.restore();
}
function drawGate(c, x, y, t) { TownArt.blit(c, TownArt.gate(), x, y); c.save(); c.globalCompositeOperation = 'lighter'; [-1, 1].forEach(s => { const px = x + s * 46, py = y - 144; const g = c.createRadialGradient(px, py, 0, px, py, 26 + Math.sin(t * 9 + s) * 3); g.addColorStop(0, 'rgba(255,170,80,.6)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(px - 30, py - 30, 60, 60); }); c.fillStyle = `rgba(255,120,200,${0.5 + 0.3 * Math.sin(t * 3)})`; c.fillRect(x - 3, y - 72, 6, 8); c.fillRect(x - 3, y - 52, 6, 8); c.restore(); }
function drawStall(c, n, t) { TownArt.blit(c, TownArt.stall(n), n.x, n.y - 34); if (n.stall === 'forge') { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,160,60,${0.4 + 0.3 * Math.sin(t * 7)})`; c.beginPath(); c.arc(n.x + 38, n.y - 68, 10, 0, 6.283); c.fill(); c.restore(); } }
function drawNpc(c, n, t, face, portrait) {
  const bob = Math.sin(t * 2.2 + n.x) * 1.5, blink = ((t * 0.37 + n.x * 0.01) % 3.1) < 0.12, sp = TownArt.npc(n.kind, blink);
  c.save(); c.translate(n.x, n.y - bob); c.scale(face || 1, 1); c.drawImage(sp.cv, -sp.ax, -sp.ay, sp.cv.width / TownArt.K, sp.cv.height / TownArt.K); c.restore();
}
function drawBuilding(c, b, t) {
  const W = WORLDS[b.w - 1], open = worldOpen(W.id), sp = TownArt.building(b, open, W);
  c.drawImage(sp.cv, b.x - sp.ax, b.y + b.bh - sp.ay, sp.cv.width / TownArt.K, sp.cv.height / TownArt.K);
  if (!open) return;
  const got = W.stages.reduce((a, _, j) => a + (st.map.stars[skey(W.id, j + 1)] || 0), 0);
  if (got) { c.fillStyle = '#FFE37A'; c.strokeStyle = '#2B2433'; c.lineWidth = 3; c.font = '800 11px system-ui, sans-serif'; c.textAlign = 'center'; const ty = (b.style === 'hedge' ? b.y + 70 : b.style === 'mine' ? b.y + b.bh - 74 : b.y + b.bh - 80) + 24; c.strokeText(`★ ${got}/${W.stages.length * 3}`, b.x + b.bw / 2, ty); c.fillText(`★ ${got}/${W.stages.length * 3}`, b.x + b.bw / 2, ty); }
  // the living details: smoke, the balloon, the slingshot band, waving flags, the dome's stars, lit windows at night
  const x = b.x, y = b.y, bw = b.bw, bh = b.bh;
  const hNow = town.hour != null ? town.hour : new Date().getHours();
  if (hNow >= 18 || hNow < 7) { const WIN = { hangar: [50, [0.15, 0.5, 0.85], 0.4], dome: [60, [0.2, 0.5, 0.8], 0.45], tent: [54, [0.2, 0.8], 0.45], gym: [36, [0.17, 0.5, 0.83], 0.45] }[b.style]; if (WIN) { const [top, us, v] = WIN, hh = bh - top; c.save(); c.globalCompositeOperation = 'lighter'; us.forEach((u, i) => { const wx = x + bw * u, wy = y + top + hh * v, fl = 0.55 + 0.15 * Math.sin(t * 5 + i + x); c.fillStyle = `rgba(255,190,90,${fl})`; c.fillRect(wx - 13, wy - 12, 26, 24); const g = c.createRadialGradient(wx, wy, 4, wx, wy, 40); g.addColorStop(0, 'rgba(255,190,90,.35)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(wx - 40, wy - 40, 80, 80); }); c.restore(); } }
  if (b.style === 'hangar') { const bx = x + bw - 30 + Math.sin(t * 0.8) * 6, by = y - 80 + Math.sin(t * 1.1) * 5; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + bw - 30, y + 50); c.lineTo(bx, by + 46); c.stroke(); const g = c.createRadialGradient(bx - 10, by - 12, 4, bx, by, 36); g.addColorStop(0, '#FFB4A6'); g.addColorStop(0.5, '#FF6F59'); g.addColorStop(1, '#B5321E'); c.fillStyle = g; c.lineWidth = 2.5; c.beginPath(); c.ellipse(bx, by, 30, 36, 0, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = '#FFE37A'; c.beginPath(); c.ellipse(bx, by, 10, 36, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(bx - 12, by - 14, 6, 12, 0.3, 0, 6.283); c.fill(); c.fillStyle = '#8A6A3A'; GFX.rr(c, bx - 10, by + 42, 20, 14, 3); c.fill(); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx - 20, by + 28); c.lineTo(bx - 8, by + 42); c.moveTo(bx + 20, by + 28); c.lineTo(bx + 8, by + 42); c.stroke(); }
  if (b.style === 'tent') { c.strokeStyle = '#D9483B'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 16, y + 40); c.quadraticCurveTo(x + 40, y + 72 + Math.sin(t * 3) * 4, x + 64, y + 40); c.stroke(); }
  if (b.style === 'gym') for (let i = 0; i < 6; i++) { const fx = x + 10 + i * (bw - 20) / 5, sw = Math.sin(t * 4 + i) * 4; c.fillStyle = ['#FF6F59', '#FFE37A', '#7FD3F2', '#FF9BD2', '#B983F5', '#6CC15A'][i]; c.beginPath(); c.moveTo(fx, y - 14); c.lineTo(fx + 20 + sw, y - 4); c.lineTo(fx, y + 6); c.closePath(); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = 1.5; c.stroke(); }
  if (b.style === 'dome') for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`; c.beginPath(); c.arc(x + 20 + i * 34, y - 16 + (i % 2) * 14, 2, 0, 6.283); c.fill(); }
  if (b.style === 'hangar' || b.style === 'gym' || b.style === 'tent') { /* chimney-less */ } else if (b.style !== 'hedge' && b.style !== 'mine' && b.style !== 'dome') { for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i / 3) % 1); c.fillStyle = `rgba(230,230,240,${0.35 * (1 - u)})`; c.beginPath(); c.arc(x + bw * 0.78 + 7 + Math.sin(u * 6 + i) * 6, y - 60 - 26 - u * 40, 6 + u * 10, 0, 6.283); c.fill(); } }
  if (b.style === 'mine') for (let i = 0; i < 4; i++) { const u = (t * 0.7 + i / 4) % 1; c.fillStyle = `rgba(255,200,120,${0.5 * (1 - u)})`; c.beginPath(); c.arc(x + bw / 2 + Math.sin(u * 9 + i) * 10, y + bh - 20 - u * 60, 2, 0, 6.283); c.fill(); }
}

/* ---------- the world map: the Adventure hub ----------
   The chart of Gaia is far larger than the screen: it is panned by dragging, zoomed by pinching or the wheel, and every
   destination on it is a button (the town, the Tower, the twelve rifts, their twelve Anima gates, the Great Rift and
   the places on the roads). Tapping a destination opens its card at the foot of the screen: a dungeon's name, level,
   state and Enter; a gate's constellation, Anima, prerequisite, activity and duration. A filter row shows every
   destination, the dungeons or the gates; the Rifts tab is the same information as a list. */
const WV = { x: 0, y: 0, s: 0.62, filter: 'all', sel: null, init: false };
function worldData() { const best = st.dun.best || 0, RS = riftState(), open = {}; for (const r of RIFT_PLAN) open[r.id] = riftOpen(r.id) ? 1 : 0; return { best, stars: totalStars(), pets: 1 + st.others.length, seals: RS.seals, gates: RS.gates, open, rlyeh: RS.rlyeh ? 1 : 0 }; }
function renderWorld() {
  if (!mapOpen || !st) return;
  $('#mapStars').textContent = String(totalStars()); $('#mapView .mpill small').textContent = '/' + maxStars(); $('#mapEnergy b').textContent = Math.round(st.energy) + '%';
  const data = worldData(), cv = WorldMap.bake(data), P = WorldMap.PLACES, best = data.best;
  const spot = (cls, wm, id, x, y, inner, aria) => `<button class="wm-spot ${cls}" type="button" data-wm="${wm}"${id ? ` data-id="${id}"` : ''} style="left:${x}px;top:${y}px" aria-label="${esc(aria)}">${inner}</button>`;
  const spots = [spot('wm-town', 'town', '', P.town.x, P.town.y - 10, `<span class="wm-petwrap">${petSVG(curForm(), { frame: 'fit' })}</span>`, 'Pocket Town: shops and mini-games'), spot('wm-tower', 'tower', '', P.tower.x, P.tower.y - 20, '<span class="wm-ring"></span>', `The Tower of Oblivion, best floor ${best}`)];
  for (const r of RIFT_PLAN) { const o = riftOpen(r.id), sd = riftSealed(r.id); if (r.final) { if (!o) continue; spots.push(spot('wm-rift wm-final', 'rift', r.id, P.rifts.rlyeh.x, P.rifts.rlyeh.y - 10, '<span class="wm-hit"></span>', r.name)); continue; }
    spots.push(spot(`wm-rift${sd ? ' sealed' : o ? ' open' : ' locked'}`, 'rift', r.id, P.rifts[r.id].x, P.rifts[r.id].y - 24, '<span class="wm-hit"></span>', `${r.name}: ${sd ? 'sealed' : o ? `rift ${r.n}, level ${r.lvl}` : 'locked'}`));
    spots.push(spot(`wm-gate${gateDone(r.id) ? ' done' : gateOpen(r.id) ? ' open' : ' locked'}`, 'gate', r.id, P.gates[r.id].x, P.gates[r.id].y - 18, '<span class="wm-hit"></span>', `${r.gate.name}: ${gateDone(r.id) ? 'Anima unlocked' : gateOpen(r.id) ? 'trial available' : 'locked'}`)); }
  spots.push(spot('wm-great', 'great', '', P.great.x, P.great.y, '<span class="wm-hit"></span>', data.rlyeh ? "R'lyeh Above the World" : 'The Great Rift'));
  P.extras.forEach((e, i) => spots.push(spot('wm-extra', 'extra', String(i), e.x, e.y - 8, '<span class="wm-hit"></span>', e.name)));
  mapInner.style.width = ''; mapInner.style.height = '';
  mapInner.innerHTML = `<div class="world-view" id="worldView" data-filter="${WV.filter}"><div class="world-pan" id="worldPan" style="width:${WorldMap.W}px;height:${WorldMap.H}px"><div class="world-canvas" id="worldCanvas"></div>${spots.join('')}</div>
    <div class="world-tools"><div class="wt-filters" role="group" aria-label="Show">${[['all', 'All'], ['rift', 'Dungeons'], ['gate', 'Anima gates']].map(([k, t]) => `<button class="wt-chip${WV.filter === k ? ' on' : ''}" type="button" data-wfilter="${k}">${t}</button>`).join('')}<button class="wt-chip" type="button" data-wm="list">List</button></div>
    <div class="wt-zoom"><button type="button" data-wzoom="-1" aria-label="Zoom out">−</button><button type="button" data-wzoom="1" aria-label="Zoom in">+</button></div></div></div>`;
  const holder = $('#worldCanvas'); cv.style.width = WorldMap.W + 'px'; cv.style.height = WorldMap.H + 'px'; cv.style.display = 'block'; holder.appendChild(cv);
  worldPanInit(); mapCard.hidden = true; if (WV.sel) worldCard(WV.sel.wm, WV.sel.id, true);
}
/* panning and zooming the chart */
function worldPanInit() {
  const view = $('#worldView'), pan = $('#worldPan'); if (!view) return;
  const vw = () => view.clientWidth || 390, vh = () => view.clientHeight || 600;
  const clampV = () => { const minS = Math.max(0.28, Math.min(vw() / WorldMap.W, vh() / WorldMap.H) * 0.9); WV.s = Math.max(minS, Math.min(1.6, WV.s)); const w = WorldMap.W * WV.s, h = WorldMap.H * WV.s; WV.x = w <= vw() ? (vw() - w) / 2 : Math.max(vw() - w, Math.min(0, WV.x)); WV.y = h <= vh() ? (vh() - h) / 2 : Math.max(vh() - h, Math.min(0, WV.y)); };
  const apply = () => { clampV(); pan.style.transform = `translate(${WV.x}px,${WV.y}px) scale(${WV.s})`; };
  const centreOn = (x, y) => { WV.x = vw() / 2 - x * WV.s; WV.y = vh() / 2 - y * WV.s; apply(); };
  if (!WV.init) { WV.init = true; WV.s = Math.max(0.5, Math.min(0.8, vw() / 620)); const P = WorldMap.PLACES, cur = RIFT_PLAN.find(r => !r.final && riftOpen(r.id) && !riftSealed(r.id)); const at = cur ? P.rifts[cur.id] : P.town; centreOn(at.x, at.y); } else apply();
  const zoomAt = (k, cx, cy) => { const s0 = WV.s; WV.s = Math.max(0.28, Math.min(1.6, WV.s * k)); const r = WV.s / s0; WV.x = cx - (cx - WV.x) * r; WV.y = cy - (cy - WV.y) * r; apply(); };
  const ptrs = new Map(); let drag = null, pinch = null, moved = 0;
  view.addEventListener('pointerdown', e => { if (e.target.closest('.world-tools')) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, px: WV.x, py: WV.y }; moved = 0; } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: WV.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, px: WV.x, py: WV.y }; drag = null; } });
  view.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), rect = view.getBoundingClientRect(), cx = (a.x + b.x) / 2 - rect.left, cy = (a.y + b.y) / 2 - rect.top; const s1 = Math.max(0.28, Math.min(1.6, pinch.s * d / Math.max(10, pinch.d))), r = s1 / pinch.s; WV.s = s1; WV.x = cx - (pinch.cx - rect.left - pinch.px) * r; WV.y = cy - (pinch.cy - rect.top - pinch.py) * r; moved = 99; apply(); return; }
    // (the pointer is held by the chart only once it is really dragging: held from the first press, a mouse's click would
    // be sent to the chart itself rather than to the place under it, and no place could be clicked)
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); if (moved > 8 && !drag.held) { drag.held = true; try { view.setPointerCapture(e.pointerId); } catch (_) {} } WV.x = drag.px + dx; WV.y = drag.py + dy; apply(); } });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) drag = null; };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('click', e => { if (moved > 8) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  view.addEventListener('wheel', e => { e.preventDefault(); const rect = view.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top); }, { passive: false });
  view.addEventListener('click', e => { const z = e.target.closest('[data-wzoom]'); if (z) { zoomAt(z.dataset.wzoom === '1' ? 1.3 : 1 / 1.3, vw() / 2, vh() / 2); return; } const f = e.target.closest('[data-wfilter]'); if (f) { WV.filter = f.dataset.wfilter; view.dataset.filter = WV.filter; $$('.wt-chip', view).forEach(b => b.classList.toggle('on', b.dataset.wfilter === WV.filter)); } });
  WV.centreOn = centreOn;
}
/* the destination cards */
function worldCard(wm, id, quiet) {
  const P = WorldMap.PLACES; WV.sel = { wm, id }; $$('.wm-spot', mapInner).forEach(b => { b.classList.toggle('sel', b.dataset.wm === wm && (b.dataset.id || '') === (id || '')); b.classList.toggle('pair', (wm === 'rift' && b.dataset.wm === 'gate' && b.dataset.id === id) || (wm === 'gate' && b.dataset.wm === 'rift' && b.dataset.id === id)); });
  let html = '';
  if (wm === 'rift') { const r = RIFT_PLAN.find(q => q.id === id), o = riftOpen(id), sd = riftSealed(id), built = riftBuilt(id), prog = riftState().prog[id] || 0, prev = RIFT_PLAN[r.n - 2];
    html = `<div class="mc-head"><div><p class="eyebrow">${r.final ? 'The sky wound' : `Rift ${r.n} · ${esc(r.region)}`} · level ${r.lvl}</p><h2>${esc(r.name)}</h2></div><span class="mc-state ${sd ? 'done' : o ? 'open' : 'lock'}">${sd ? 'Sealed' : o ? (prog ? `Stage ${prog + 1}` : 'Open') : 'Locked'}</span></div>
      <p class="mc-text">${sd ? `Its ${esc(r.sigil)} Sigil holds the tear shut; the ${esc(r.gate ? r.gate.name : '')} is open beside it.` : o ? (built ? `Fourteen stages, three sections, three Super Fiend-class bosses. ${prog ? `You stopped at stage ${prog + 1}.` : ''}` : 'Not yet built in this version.') : riftLockText(r)}</p>
      <div class="mc-actions">${o && built ? `<button class="btn primary" type="button" data-wcard="enter" data-id="${id}">${sd ? 'Enter again' : prog ? 'Continue' : 'Enter'}</button>` : ''}<button class="btn" type="button" data-wcard="list" data-id="${id}">Details</button><button class="btn ghost" type="button" data-wcard="close">Close</button></div>`; }
  else if (wm === 'gate') { const r = RIFT_PLAN.find(q => q.id === id), A = ANIMAS[r.gate.anima], go = gateOpen(id), gd = gateDone(id), built = !!RIFT_GATES[id];
    html = `<div class="mc-head"><div><p class="eyebrow">${esc(A.sign)} gate · ${esc(A.name)}</p><h2>${esc(r.gate.name)}</h2></div><span class="mc-state ${gd ? 'done' : go ? 'open' : 'lock'}">${gd ? 'Anima unlocked' : go ? 'Trial available' : 'Locked'}</span></div>
      <p class="mc-text">${esc(r.gate.what)} · about ${esc(r.gate.mins)} minutes. ${gd ? `${esc(A.name)} answers your summons.` : go ? (built ? 'No combat: a trial for your pet.' : 'Not yet built in this version.') : `Clear ${esc(r.name)} to open it.`}</p>
      <div class="mc-actions">${go && built ? `<button class="btn primary" type="button" data-wcard="gate" data-id="${id}">${gd ? 'Replay the trial' : 'Begin the trial'}</button>` : ''}<button class="btn" type="button" data-wcard="list" data-id="${id}">Details</button><button class="btn ghost" type="button" data-wcard="close">Close</button></div>`; }
  else if (wm === 'great') { const n = sealCount(); html = `<div class="mc-head"><div><p class="eyebrow">The sky wound</p><h2>${riftState().rlyeh ? "R'lyeh Above the World" : 'The Great Rift'}</h2></div><span class="mc-state ${n >= 12 ? 'open' : 'lock'}">${n}/12 seals</span></div><p class="mc-text">${riftState().rlyeh ? 'The drowned city hangs over the world, tied to the twelve sigils by threads of gold.' : 'Twelve rifts have opened across Gaia. Seal them all and the wound will show what waits behind it.'}</p><div class="mc-actions"><button class="btn" type="button" data-wcard="list">The rifts</button><button class="btn ghost" type="button" data-wcard="close">Close</button></div>`; }
  else if (wm === 'extra') { const e = P.extras[+id]; html = `<div class="mc-head"><div><p class="eyebrow">On the road</p><h2>${esc(e.name)}</h2></div></div><p class="mc-text">${esc(e.note)}. Nothing to do here but look.</p><div class="mc-actions"><button class="btn ghost" type="button" data-wcard="close">Close</button></div>`; }
  else { mapCard.hidden = true; return; }
  mapCard.innerHTML = html; mapCard.hidden = false; if (!quiet) sfx.boop();
}
mapInner.addEventListener('click', e => { const g = e.target.closest('[data-wm]'); if (!g) return; const wm = g.dataset.wm; if (wm === 'list') { setMapTab('rift'); return; } if (wm === 'town' || wm === 'tower') { sfx.unlock(); setMapTab(wm === 'tower' ? 'dungeon' : 'town'); return; } worldCard(wm, g.dataset.id); });
mapCard.addEventListener('click', e => { const b = e.target.closest('[data-wcard]'); if (!b) return; const k = b.dataset.wcard, id = b.dataset.id; if (k === 'close') { mapCard.hidden = true; WV.sel = null; $$('.wm-spot.sel,.wm-spot.pair', mapInner).forEach(x => x.classList.remove('sel', 'pair')); return; } if (k === 'list') { if (id) riftSel = id; setMapTab('rift'); return; } if (k === 'enter') { sfx.unlock(); startRift(id, riftState().prog[id] || 0); return; } if (k === 'gate') { sfx.unlock(); startGate(id); } });
