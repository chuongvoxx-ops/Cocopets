/* ---------- adventure map: six arcade worlds on a galaxy map ---------- */
const WORLDS = [
  { id: 1, key: 'flappy', name: 'Cloudpuff Isle', game: 'Puff Flight', how: 'Tap anywhere to flap. Fly through the cloud gates and grab the gems.', gate: 0, gem: 'quartz', item: 'cloud_pouf', sky: '#8FD3F7',
    stages: [
      { name: 'Breezy Start', goal: 8, gap: 188, speed: 136, spacing: 246, move: 0, hazards: 0 },
      { name: 'Gusty Gap', goal: 10, gap: 180, speed: 146, spacing: 240, move: 0.15, hazards: 0 },
      { name: 'Cloud Slalom', goal: 12, gap: 172, speed: 156, spacing: 234, move: 0.3, hazards: 0.12 },
      { name: 'Puff Parade', goal: 14, gap: 164, speed: 164, spacing: 228, move: 0.4, hazards: 0.22 },
      { name: 'Storm Crown', goal: 16, gap: 156, speed: 172, spacing: 222, move: 0.5, hazards: 0.3, wind: true },
    ] },
  { id: 2, key: 'maze', name: 'Hedgemaze Moon', game: 'Snack Maze', how: 'Swipe to steer. Eat the berries, dodge the dust bunnies, and grab a star cookie to chase them off. You don\'t need every berry, so skip the risky corners.', gate: 3, gem: 'amethyst', item: 'topiary', sky: '#2E5A3A',
    stages: [
      { name: 'Little Garden', maze: 0, chasers: 2, speed: 4.6, power: 7, berries: 50 },
      { name: 'Berry Loop', maze: 1, chasers: 3, speed: 5.1, power: 6, berries: 60 },
      { name: 'Twisty Hedges', maze: 2, chasers: 4, speed: 5.5, power: 5, berries: 70 },
      { name: 'Moon Labyrinth', maze: 3, chasers: 4, speed: 6, power: 4, berries: 80 },
    ] },
  { id: 3, key: 'shooter', name: 'Starfall Belt', game: 'Star Blaster', how: 'Drag to fly your ship. It fires your pet\'s own ability by itself. Fill the star button, then tap it for a special move.', gate: 7, gem: 'citrine', item: 'saturn_lamp', sky: '#1A1440',
    stages: [
      { name: 'Twinkle Drift', waves: 0 },
      { name: 'Comet Lane', waves: 1 },
      { name: 'Jelly Nebula', waves: 2 },
      { name: 'The Gloom Moon', waves: 3, boss: true },
    ] },
  { id: 4, key: 'blocks', name: 'Geode Rock', game: 'Gem Drop', how: 'Move and turn the falling blocks. Clear rows to dig the buried gems free.', gate: 12, gem: 'emerald', item: 'block_tower', sky: '#2B2246',
    stages: [
      { name: 'Pebble Patch', rows: 3, gems: 3, fall: 0.85, par: 18 },
      { name: 'Sandy Seam', rows: 4, gems: 4, fall: 0.72, par: 26 },
      { name: 'Crystal Vein', rows: 5, gems: 5, fall: 0.62, par: 34 },
      { name: 'Deep Geode', rows: 6, gems: 6, fall: 0.54, par: 42, rise: 32 },
    ] },
  { id: 5, key: 'sling', name: 'Boulder Bluffs', game: 'Sling Pop', how: 'Drag your pet back on the sling and let go. Pop every gloomy. Tap mid-flight for a dash.', gate: 18, gem: 'sapphire', item: 'gloomy_plush', sky: '#F6C98B',
    stages: [
      { name: 'First Fling', level: 0 },
      { name: 'Ice Palace', level: 1 },
      { name: 'Stone Fort', level: 2 },
      { name: 'The Gloom King', level: 3 },
    ] },
  { id: 6, key: 'platform', name: 'Hopscotch Hills', game: 'Hop Quest', how: 'Use the arrows to run and the button to jump. Stomp the gloomies, dodge the spiky ones, and find the 3 star gems.', gate: 25, gem: 'starstone', item: 'crystal_geode', sky: '#9DDCF7',
    stages: [
      { name: 'Meadow Run', level: 0 },
      { name: 'Berry Bluffs', level: 1 },
      { name: 'Crystal Caves', level: 2 },
      { name: 'Sky Castle', level: 3 },
    ] },
];
const MILESTONES = [
  { id: 'm10', stars: 10, item: 'arcade_cab', label: 'Arcade cabinet' },
  { id: 'm25', stars: 25, pearls: 30, label: '30 pearls' },
  { id: 'm40', stars: 40, item: 'trophy_cup', label: 'Champion trophy' },
  { id: 'm60', stars: 60, item: 'pet_statue', label: 'Golden pet statue' },
];
const skey = (w, s) => `w${w}s${s}`;
const stageCount = w => WORLDS[w - 1].stages.length;
const maxStars = () => WORLDS.reduce((a, W) => a + W.stages.length * 3, 0);
const totalStars = () => Object.values(st.map.stars).reduce((a, b) => a + b, 0);
function worldOpen(w) { return st.unlockAll || totalStars() >= WORLDS[w - 1].gate; }
function stageOpen(w, s) { return worldOpen(w) && (st.unlockAll || s === 1 || st.map.stars[skey(w, s - 1)] > 0); }
/* the last stage of each world gives its evolution gemstone on every clear, so a gem you need can always be won again */
const stageGem = (w, s) => s === stageCount(w) ? WORLDS[w - 1].gem : null;
function firstReward(w, s) {
  const W = WORLDS[w - 1];
  if (stageGem(w, s)) return null;
  if (s === 1) return { coins: 100, label: '100 coins', icon: ICON.coin };
  if (s === 2) return { item: W.item, label: `${ITEMS[W.item].name} (rare decor)`, icon: `<span class="ri">${itemArt(W.item)}</span>` };
  return { pearls: 10, label: '10 pearls', icon: ICON.pearl };
}

/* ---------- planets ---------- */
function planetSVG(key) {
  const L = 'stroke="#2B2433" stroke-width="3" stroke-linejoin="round"';
  const L2 = 'stroke="#2B2433" stroke-width="2.2" stroke-linejoin="round"';
  const disc = (id, a, b) => `<defs><radialGradient id="pl-${id}" cx="34%" cy="30%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
  const cloud = (x, y, s) => `<path d="M${x - 14 * s} ${y + 6 * s}c${-8 * s} 0 ${-8 * s} ${-11 * s} 0 ${-12 * s}c0 ${-8 * s} ${10 * s} ${-12 * s} ${16 * s} ${-6 * s}c${4 * s} ${-8 * s} ${18 * s} ${-6 * s} ${18 * s} ${4 * s}c${8 * s} ${-1 * s} ${10 * s} ${13 * s} 0 ${14 * s}z" fill="#FFFFFF" ${L2}/>`;
  switch (key) {
    case 'flappy': return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('a', '#E8F7FF', '#6FBCEB')}<circle r="52" fill="url(#pl-a)" ${L}/><path d="M-50 12Q-34 2 -18 10Q-2 0 14 10Q30 2 50 12Q46 30 30 40Q0 54 -30 40Q-46 30 -50 12Z" fill="#FFFFFF" opacity=".9"/><path d="M-30 -30q10 -8 20 -2" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>${cloud(-52, -38, 1.1)}${cloud(50, 30, 0.9)}${cloud(40, -50, 0.7)}</svg>`;
    case 'maze': return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('b', '#A8E39A', '#3E9C5B')}<circle r="52" fill="url(#pl-b)" ${L}/><g fill="none" stroke="#2E7A45" stroke-width="6" stroke-linecap="round"><path d="M-34 -20H-6V2M10 -36V-14H34M-40 18H-14V36M8 14H30V34M-20 -42H6"/></g><g fill="#E85C8F" stroke="#2B2433" stroke-width="1.5"><circle cx="-24" cy="-6" r="3.6"/><circle cx="20" cy="2" r="3.6"/><circle cx="-2" cy="26" r="3.6"/><circle cx="24" cy="-28" r="3.6"/></g><circle cx="44" cy="-46" r="9" fill="#F4F1E0" ${L2}/></svg>`;
    case 'shooter': return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('c', '#D9C6FF', '#7154C9')}<ellipse rx="74" ry="17" transform="rotate(-18)" fill="none" stroke="#2B2433" stroke-width="9"/><ellipse rx="74" ry="17" transform="rotate(-18)" fill="none" stroke="#FFD447" stroke-width="4.5"/><circle r="48" fill="url(#pl-c)" ${L}/><path d="M-70.4 22.9A74 17 -18 0 0 70.4 -22.9" fill="none" stroke="#2B2433" stroke-width="9" stroke-linecap="round"/><path d="M-70.4 22.9A74 17 -18 0 0 70.4 -22.9" fill="none" stroke="#FFD447" stroke-width="4.5" stroke-linecap="round"/><g fill="#5A3FAE" opacity=".5"><circle cx="-14" cy="-18" r="7"/><circle cx="16" cy="10" r="5"/></g><path d="M-26 -28q8 -6 16 -4" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/></svg>`;
    case 'blocks': return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('d', '#8C82A8', '#3E3757')}<g ${L2}><path d="M-18 -46L-6 -70L4 -46Z" fill="#7FE0F2"/><path d="M8 -48L22 -66L26 -44Z" fill="#B8A3F2"/><path d="M36 -30L60 -40L48 -18Z" fill="#8FD9B6"/><path d="M-44 -26L-64 -38L-48 -12Z" fill="#FF9BC8"/></g><circle r="52" fill="url(#pl-d)" ${L}/><path d="M-30 -8L-8 -26L18 -12L22 14L-4 30L-28 16Z" fill="#2B2246" ${L2}/><g ${L2}><path d="M-18 4L-10 -16L-2 6Z" fill="#7FE0F2"/><path d="M-2 10L8 -12L14 12Z" fill="#B8A3F2"/><path d="M-22 14L-14 2L-8 18Z" fill="#FFD447"/><path d="M6 20L14 8L18 22Z" fill="#8FD9B6"/></g></svg>`;
    case 'sling': return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('e', '#FFD7A0', '#D9823F')}<g ${L2}><rect x="-14" y="-74" width="12" height="26" fill="#C98B4E"/><rect x="2" y="-66" width="12" height="18" fill="#C98B4E"/><rect x="-20" y="-80" width="40" height="8" fill="#B07A3A"/><circle cx="-6" cy="-86" r="6" fill="#5A4E7A"/></g><circle r="52" fill="url(#pl-e)" ${L}/><g fill="#B9672E" opacity=".55"><circle cx="-18" cy="10" r="10"/><circle cx="20" cy="-14" r="7"/><circle cx="14" cy="26" r="5"/></g><path d="M-30 -30q8 -8 18 -6" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/></svg>`;
    default: return `<svg viewBox="-80 -80 160 160" aria-hidden="true">${disc('f', '#E6F59A', '#62B05A')}<circle r="52" fill="url(#pl-f)" ${L}/><path d="M-52 4Q-34 -14 -16 0Q2 -20 22 -2Q38 -14 52 2L50 18Q0 40 -50 18Z" fill="#4E9A4A" opacity=".75"/><g ${L2}><rect x="-8" y="-70" width="16" height="22" fill="#F3E3C3"/><path d="M-11 -70H11L8 -76H-8Z" fill="#E36B5A"/><path d="M0 -76V-90" stroke="#2B2433" stroke-width="2"/><path d="M0 -90L12 -86L0 -82Z" fill="#FFD447"/></g><path d="M-30 -30q8 -8 18 -6" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/></svg>`;
  }
}

/* ---------- the map view ---------- */
let mapOpen = false, mapSel = null, mapGeo = null;
const mapEl = $('#mapView'), mapScroll = $('#mapScroll'), mapInner = $('#mapInner'), mapCard = $('#mapCard');
function mapLayout() {
  const w = Math.min(mapScroll.clientWidth || 360, 520);
  const step = 330, top = 150, h = top + WORLDS.length * step + 330;
  const worlds = WORLDS.map((W, i) => {
    const left = i % 2 === 0;
    const cy = h - 440 - i * step, cx = (left ? 0.3 : 0.7) * w;
    const sx = left ? 1 : -1;
    const tpl = W.stages.length >= 5 ? [[0.6, 118], [0.84, 62], [0.88, -2], [0.76, -66], [0.54, -128]] : [[0.64, 104], [0.86, 34], [0.78, -50], [0.54, -120]];
    const nodes = tpl.slice(0, W.stages.length).map(([fx, dy]) => [left ? fx * w : (1 - fx) * w, cy + dy]);
    return { W, cx, cy, left, sx, nodes };
  });
  mapGeo = { w, h, worlds };
  return mapGeo;
}
function mapPath(pts) {
  let d = `M${pt(pts[0][0], pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${pt(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${pt(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${pt(p2[0], p2[1])}`;
  }
  return d;
}
function renderMap() {
  if (!mapOpen || !st) return;
  const g = mapLayout();
  $('#mapStars').textContent = String(totalStars());
  $('#mapView .mpill small').textContent = '/' + maxStars();
  $('#mapEnergy b').textContent = Math.round(st.energy) + '%';
  const R = mulberry32(42);
  let stars = '';
  for (let i = 0; i < 120; i++) stars += `<circle cx="${r1(R() * g.w)}" cy="${r1(R() * g.h)}" r="${r1(0.6 + R() * 1.6)}" fill="#FFFFFF" opacity="${r1(0.3 + R() * 0.6)}"${i % 7 === 0 ? ' class="tw"' : ''}/>`;
  const all = [].concat(...g.worlds.map(x => x.nodes));
  const doneUpTo = (() => { let n = 0, k = 0; g.worlds.forEach((x, i) => x.nodes.forEach((p, j) => { k++; if (st.map.stars[skey(i + 1, j + 1)] > 0) n = k; })); return n; })();
  const pathAll = mapPath(all), pathDone = doneUpTo > 1 ? mapPath(all.slice(0, doneUpTo + 1 > all.length ? all.length : doneUpTo + 1)) : '';
  let svg = `<svg class="map-bg" viewBox="0 0 ${g.w} ${g.h}" width="${g.w}" height="${g.h}" aria-hidden="true"><defs><radialGradient id="neb1"><stop offset="0" stop-color="#9B6BFF" stop-opacity=".45"/><stop offset="1" stop-color="#9B6BFF" stop-opacity="0"/></radialGradient><radialGradient id="neb2"><stop offset="0" stop-color="#4FC3F7" stop-opacity=".35"/><stop offset="1" stop-color="#4FC3F7" stop-opacity="0"/></radialGradient></defs>`;
  for (let i = 0; i < 6; i++) svg += `<circle cx="${r1(R() * g.w)}" cy="${r1((i + 0.5) * g.h / 6)}" r="${r1(120 + R() * 80)}" fill="url(#neb${i % 2 + 1})"/>`;
  svg += stars;
  svg += `<path d="${pathAll}" fill="none" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  if (pathDone) svg += `<path d="${pathDone}" fill="none" stroke="#FFE37A" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  svg += '</svg>';
  let html = svg;
  g.worlds.forEach((x, i) => {
    const W = x.W, open = worldOpen(W.id), got = W.stages.reduce((a, _, j) => a + (st.map.stars[skey(W.id, j + 1)] || 0), 0);
    html += `<div class="planet${open ? '' : ' locked'}" style="left:${r1(x.cx)}px;top:${r1(x.cy)}px">${planetSVG(W.key)}<div class="pl-label"><b>${W.name}</b><small>${W.game} · ${got}/${W.stages.length * 3} ★</small>${open ? '' : `<span class="gate">${ICON.lock} ${W.gate} ★ to open</span>`}</div></div>`;
    x.nodes.forEach((p, j) => {
      const s = j + 1, k = skey(W.id, s), sv = st.map.stars[k] || 0, ok = stageOpen(W.id, s);
      const stars3 = [1, 2, 3].map(n => `<i class="${n <= sv ? 'on' : ''}"></i>`).join('');
      const boss = s === W.stages.length;
      html += `<button class="mnode${sv ? ' done' : ''}${ok ? '' : ' locked'}${boss ? ' boss' : ''}${mapSel && mapSel[0] === W.id && mapSel[1] === s ? ' sel' : ''}" type="button" data-w="${W.id}" data-s="${s}" style="left:${r1(p[0])}px;top:${r1(p[1])}px" aria-label="${esc(W.game)} stage ${s}: ${esc(W.stages[j].name)}${ok ? `, ${sv} of 3 stars` : ', locked'}${boss ? `, gives a ${GEMS[W.gem].name} every clear` : ''}"><b>${ok ? (boss ? gemSVG(W.gem) : s) : ICON.lock}</b><span class="nst">${stars3}</span></button>`;
    });
  });
  html += `<div class="mpet" id="mapPet">${petSVG(curForm(), { frame: 'fit' })}</div>`;
  mapInner.style.width = g.w + 'px'; mapInner.style.height = g.h + 'px';
  mapInner.innerHTML = html;
  placeMapPet(false);
}
function nextStage() {
  for (const W of WORLDS) for (let s = 1; s <= W.stages.length; s++) if (stageOpen(W.id, s) && !st.map.stars[skey(W.id, s)]) return [W.id, s];
  return [1, 1];
}
function placeMapPet(anim) {
  const el = $('#mapPet');
  if (!el || !mapGeo) return;
  const sel = mapSel || nextStage();
  const p = mapGeo.worlds[sel[0] - 1].nodes[sel[1] - 1];
  el.classList.toggle('hop', !!anim);
  el.style.transform = `translate(${r1(p[0] - 28)}px, ${r1(p[1] - 81)}px)`;
}
function openMap() {
  if (!st) return;
  closeTray(); if (decorating) exitDecor(); if (act) endActivity(true); if (homeMode) setHomeMode(false);
  mapOpen = true; mapEl.hidden = false; document.body.classList.add('in-map');
  mapSel = null; mapCard.hidden = true;
  setMapTab('world', true);
  sfx.chirp();
}
function closeMap() {
  if (mapTab === 'town') closeTown();
  mapOpen = false; mapEl.hidden = true; document.body.classList.remove('in-map'); mapCard.hidden = true;
  lastStatAt = Date.now(); updateHud();
}
function selectStage(w, s) {
  mapSel = [w, s];
  $$('.mnode', mapInner).forEach(b => b.classList.toggle('sel', +b.dataset.w === w && +b.dataset.s === s));
  placeMapPet(true);
  renderStageCard();
  revealNode(w, s);
  sfx.boop();
}
/* keep the chosen stage visible above the stage card */
function revealNode(w, s) {
  if (!mapGeo) return;
  const p = mapGeo.worlds[w - 1].nodes[s - 1];
  const cardH = mapCard.hidden ? 0 : mapCard.offsetHeight + 20;
  const top = mapScroll.scrollTop, vis = mapScroll.clientHeight - cardH;
  if (p[1] - 150 < top || p[1] + 60 > top + vis) {
    const to = Math.max(0, p[1] - Math.max(150, vis * 0.6));
    try { mapScroll.scrollTo({ top: to, behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (e) { mapScroll.scrollTop = to; }
  }
}
function closeStageCard() { mapCard.hidden = true; mapSel = null; $$('.mnode.sel', mapInner).forEach(x => x.classList.remove('sel')); placeMapPet(true); }
function renderStageCard() {
  if (!mapSel) { mapCard.hidden = true; return; }
  const [w, s] = mapSel, W = WORLDS[w - 1], S = W.stages[s - 1], k = skey(w, s);
  const ok = stageOpen(w, s), sv = st.map.stars[k] || 0, best = st.map.best[k] || 0;
  const fr = firstReward(w, s), gem = stageGem(w, s);
  let reward;
  if (gem) {
    const have = st.gems[gem] || 0, sub = [have ? `You have ${have}` : '', sv ? `Best ${fmtNum(best)}` : ''].filter(Boolean).join(' · ');
    reward = `${gemSVG(gem)}<span><small>Every clear</small>${esc(GEMS[gem].name)}${sub ? `<small class="mc-sub">${sub}</small>` : ''}</span>`;
  } else reward = sv ? `<span class="mono">Best ${fmtNum(best)}</span>` : `${fr.icon}<span><small>First clear</small>${esc(fr.label)}</span>`;
  let lockMsg = '';
  if (!worldOpen(w)) lockMsg = `Collect ${W.gate} stars to open ${W.name}. You have ${totalStars()}.`;
  else if (!ok) lockMsg = `Clear stage ${s - 1} first.`;
  const stars3 = [1, 2, 3].map(n => `<i class="${n <= sv ? 'on' : ''}"></i>`).join('');
  const goal = stageGoalText(W, S);
  mapCard.innerHTML = `<div class="mc-head"><div><p class="eyebrow">${esc(W.name)} · ${esc(W.game)}</p><h2>${w}-${s} ${esc(S.name)}</h2></div><span class="nst big">${stars3}</span><button class="icon-btn" type="button" data-mc="close" aria-label="Close">${ICON.close}</button></div>
    <p class="mc-goal">${esc(goal)}</p>
    <p class="note">${esc(W.how)}</p>
    <div class="mc-row"><div class="mc-reward${gem ? ' gem' : ''}">${reward}</div>
    ${ok ? `<button class="btn primary" type="button" data-mc="play">${ICON.play}Play${st.unlockAll ? '' : ' <span class="cost">' + ICON.bolt + '3</span>'}</button>` : `<span class="mc-lock">${ICON.lock}${esc(lockMsg)}</span>`}</div>`;
  mapCard.hidden = false;
}
function stageGoalText(W, S) {
  switch (W.key) {
    case 'flappy': return `Fly through ${S.goal} gates. Keep 3 of your 4 hearts for 3 stars.`;
    case 'maze': return `Eat ${S.berries} berries. ${S.chasers} dust bunnies on patrol.`;
    case 'shooter': return S.boss ? 'Battle the Gloom Moon with your pet\'s ability.' : 'Battle through every wave of gloomies.';
    case 'blocks': return `Free all ${S.gems} buried gems. Use ${S.par} pieces or fewer for 3 stars.`;
    case 'sling': return 'Pop every gloomy. Shots left give stars.';
    default: return 'Reach the star gate. Each hidden star gem is a star.';
  }
}
mapInner.addEventListener('click', e => {
  const b = e.target.closest('.mnode');
  if (b) { selectStage(+b.dataset.w, +b.dataset.s); return; }
  if (!mapCard.hidden) closeStageCard();
});
mapCard.addEventListener('click', e => {
  const b = e.target.closest('[data-mc]');
  if (!b) return;
  if (b.dataset.mc === 'close') { closeStageCard(); return; }
  if (b.dataset.mc === 'play' && mapSel) startStage(mapSel[0], mapSel[1]);
});
$('#mapBack').addEventListener('click', () => { sfx.unlock(); closeMap(); });

/* ---------- rewards ---------- */
function giveItem(id) { st.inv[id] = (st.inv[id] || 0) + 1; }
/* where each evolution gemstone is won: the boss stage of its world */
function gemWhere(key) { const W = WORLDS.find(x => x.gem === key); return W ? `in ${W.name} (stage ${W.id}-${W.stages.length})` : ''; }
function gemStageText(key) { const W = WORLDS.find(x => x.gem === key); return W ? `stage ${W.id}-${W.stages.length} in ${W.name}` : 'its adventure stage'; }
function focusGemStage(key) { const W = WORLDS.find(x => x.gem === key); if (W && mapOpen) { if (mapTab !== 'town') setMapTab('town', true); const b = TOWN_BUILDINGS.find(x => x.w === W.id); if (b && town) { town.pet.x = b.door[0]; town.pet.y = b.door[1] + 14; } selectStage(W.id, W.stages.length); } }
function exclSource(id) {
  const W = WORLDS.find(x => x.item === id);
  if (W) return `Win it on the Adventure map: clear stage ${W.id}-2 in ${W.name}.`;
  const m = MILESTONES.find(x => x.item === id);
  if (m) return `Win it on the Adventure map: collect ${m.stars} stars.`;
  return 'Win it on the Adventure map.';
}
/* returns the list of reward lines for the results screen */
function stageRewards(w, s, stars, score) {
  const k = skey(w, s), first = !st.map.stars[k], before = totalStars();
  const lines = [];
  const coins = Math.round((12 + 8 * s + stars * 6 + Math.min(40, score / 200)) * coinMul());
  st.coins += coins; lines.push([ICON.coin, `+${coins} coins`]);
  st.crystals = (st.crystals || 0) + CRYSTALS_PER_STAGE; lines.push([ICON.crystal, `+${CRYSTALS_PER_STAGE} crystals`]);
  // every mini-game played is a whole bond level
  const xp = bondLevelOf(st);
  addXP(xp); lines.push([ICON.heart, `+1 bond level (${fmtNum(xp)} bond)`]);
  const fr = first ? firstReward(w, s) : null;
  if (fr) {
    if (fr.coins) { st.coins += fr.coins; lines.push([ICON.coin, `First clear: +${fr.coins} coins`]); }
    if (fr.item) { giveItem(fr.item); lines.push([`<span class="ri">${itemArt(fr.item)}</span>`, `Rare decor: ${ITEMS[fr.item].name} (in Decor, My items)`]); }
    if (fr.pearls) { st.pearls += fr.pearls; lines.push([ICON.pearl, `+${fr.pearls} pearls`]); }
  }
  const gem = stageGem(w, s);
  if (gem) {
    st.gems[gem] = Math.min(99, (st.gems[gem] || 0) + 1);
    lines.push([gemSVG(gem), `Found a ${GEMS[gem].name}!`]);
    // tell the player which pet this gem lets evolve: the one playing first, then the others at home
    const ready = p => { const e = evoStatusOf(p); return !!(e && e.bondOk && e.gemOk && e.nx.gem === gem); };
    const other = ready(st) ? null : st.others.find(ready);
    if (ready(st)) lines.push([ICON.sparkle, `${st.name} can evolve now. Open the card!`]);
    else if (other) lines.push([ICON.sparkle, `${other.name} can evolve now. Switch to ${other.name} on the card.`]);
  }
  st.map.stars[k] = Math.max(st.map.stars[k] || 0, stars);
  st.map.best[k] = Math.max(st.map.best[k] || 0, Math.floor(score));
  const after = totalStars();
  MILESTONES.forEach(m => {
    if (after >= m.stars && !st.map.milestones[m.id]) {
      st.map.milestones[m.id] = true;
      if (m.item) { giveItem(m.item); lines.push([`<span class="ri">${itemArt(m.item)}</span>`, `${m.stars} stars: ${m.label}!`]); }
      if (m.pearls) { st.pearls += m.pearls; lines.push([ICON.pearl, `${m.stars} stars: +${m.pearls} pearls`]); }
    }
  });
  WORLDS.forEach(W => { if (W.gate > before && W.gate <= after) lines.push([ICON.planet, `${W.name} is open!`]); });
  st.joy = Math.min(100, st.joy + 4);
  return lines;
}
