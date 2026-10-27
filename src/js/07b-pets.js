/* ---------- more than one pet: the others live in the house as companions ---------- */
function packPet() { const o = {}; PET_KEYS.forEach(k => { o[k] = st[k]; }); return o; }
function unpackPet(o) { PET_KEYS.forEach(k => { st[k] = o[k]; }); }
const petCount = () => (st ? 1 + st.others.length : 0);
const otherScale = o => { const L = legScale(o); return (L != null ? L : STAGES[o.stage].scale * (formOf(o).grow || 1)) * (o.dna.size || 1); };

let comps = [];
function buildCompanions() {
  const keep = new Map(comps.map(c => [c.o.uid, c]));
  comps.forEach(c => c.el.remove());
  comps = [];
  if (!st) return;
  // only the party shares the house; everyone else rests in the pocket dimension
  const party = partyPets();
  st.others.forEach((o, i) => {
    if (!party.includes(o)) return;
    const el = document.createElement('div');
    el.className = 'pet comp';
    const of = formOf(o), lf = of.x && of.x.gold && of.stage >= 7 ? of.x.leg : null;
    el.innerHTML = `${lf ? magicCircleHTML(lf, of) : ''}<div class="pet-shadow"></div><div class="pet-rig">${petRigHTML(of, {})}</div><div class="bubble" hidden></div>`;
    worldEl.appendChild(el);
    const old = keep.get(o.uid);
    const c = { i, o, el, rig: $('.pet-rig', el), svg: $('.pet-rig svg', el), bub: $('.bubble', el), shadow: $('.pet-shadow', el), circle: $('.pet-circle', el),
      x: old ? old.x : rand(B.x0, B.x1), y: old ? old.y : rand(B.y0 + (B.y1 - B.y0) * 0.3, B.y1), vx: 0, vy: 0, facing: Math.random() < 0.5 ? 1 : -1,
      goal: null, think: rand(0.5, 3), phase: 0, lift: 0, liftV: 0, blinkEnd: 0, blinkAt: now() + rand(1, 4), zT: rand(0, 2), bubT: 0, sq: 0, face: '', needT: rand(4, 12) };
    c.leg = legParts(c.rig); c.legPh = Math.random() * 6;
    const cf = formOf(o); c.levit = !!(cf.x && cf.x.gold && cf.stage >= 7);
    comps.push(c);
  });
}
/* after switching rooms the others follow you in */
function enterCompanions(side) {
  comps.forEach((c, k) => {
    c.x = side < 0 ? B.x0 + k * 14 : B.x1 - k * 14;
    c.y = clamp(pet.y + rand(-0.15, 0.15) * (B.y1 - B.y0), B.y0, B.y1);
    c.goal = c.o.asleep || st.lightsOff ? null : clampXY(c.x - side * W * rand(0.2, 0.55), c.y + rand(-30, 30));
  });
}
function compHop(c, h) { if (c.lift <= 0) c.liftV = Math.sqrt(2 * GRAV * (h || ps * 0.12)); }
function updateCompanions(dt) {
  const t = now();
  for (const c of comps) {
    const o = c.o, asleep = o.asleep || st.lightsOff;
    if (asleep) {
      c.goal = null; c.vx *= 0.8; c.vy *= 0.8;
      c.zT -= dt; if (c.zT <= 0) { c.zT = 2.2; spawnFx('z', c.x + c.facing * pb * 0.15 * otherScale(o), c.y - pb * otherScale(o) * 0.55); }
    } else {
      c.needT -= dt;
      if (c.needT <= 0) {
        c.needT = rand(12, 18);
        const need = o.food < 25 ? ICON.bowl : o.energy < 18 ? ICON.moon : o.clean < 25 ? ICON.drop : o.joy < 30 ? ICON.ball : null;
        if (need && c.bubT <= 0) { c.bub.innerHTML = need; c.bub.hidden = false; c.bub.classList.remove('pop'); void c.bub.offsetWidth; c.bub.classList.add('pop'); c.bubT = 2.6; }
      }
      c.think -= dt;
      if (!c.goal && c.think <= 0) {
        c.think = rand(3, 8);
        const r = Math.random();
        if (r < 0.45) c.goal = clampXY(c.x + rand(-0.4, 0.4) * W, c.y + rand(-0.2, 0.2) * H);
        else if (r < 0.7) c.goal = clampXY(pet.x + rand(-1, 1) * ps * 0.9, pet.y + rand(-0.35, 0.35) * ps);
        else if (r < 0.82 && bflies.length) { const b = pick(bflies); c.goal = clampXY(b.x, Math.max(b.y + ps * 0.5, B.y0)); c.run = true; }
        else if (r < 0.92) { compHop(c); sfx.chirp && Math.random() < 0.3 && sfx.chirp(); }
        else c.facing *= -1;
      }
      if (c.goal) {
        const dx = c.goal[0] - c.x, dy = c.goal[1] - c.y, d = hyp(dx, dy);
        if (d < 6) { c.goal = null; c.run = false; if (Math.random() < 0.35) compHop(c); c.vx = c.vy = 0; }
        else {
          const sp = ps * (c.run ? 1.9 : 0.95) * (o.food < 20 || o.energy < 15 ? 0.6 : 1) * clamp(d / (ps * 0.5), 0.3, 1);
          const k = 1 - Math.exp(-dt * 7);
          c.vx += (dx / d * sp - c.vx) * k; c.vy += (dy / d * sp - c.vy) * k;
          const q = clampXY(c.x + c.vx * dt, c.y + c.vy * dt); c.x = q[0]; c.y = q[1];
          if (Math.abs(c.vx) > 10) c.facing = c.vx > 0 ? 1 : -1;
          c.phase += dt * (hyp(c.vx, c.vy) / ps) * 7.5;
        }
      } else if (Math.random() < dt * 0.3) c.facing = pet.x > c.x ? 1 : -1;
    }
    if (c.lift > 0 || c.liftV > 0) { c.liftV -= GRAV * dt; c.lift += c.liftV * dt; if (c.lift <= 0) { c.lift = 0; c.liftV = 0; c.sq = 0.18; } }
    c.sq *= Math.exp(-dt * 9);
    // draw
    const depth = 0.88 + 0.12 * clamp((c.y - B.y0) / Math.max(1, B.y1 - B.y0), 0, 1);
    const s = otherScale(o) * depth, moving = !!c.goal && hyp(c.vx, c.vy) > 15;
    const lev = c.levit ? levitate(t + c.i * 1.3, asleep, false) : 0; c.lev = lev;
    const bob = moving && !c.levit ? Math.abs(Math.sin(c.phase)) * ps * 0.04 : 0;
    const br = Math.sin(t * (asleep ? 1.6 : 2.4) + c.i) * (asleep ? 0.035 : 0.016);
    const sx = 1 + c.sq * 0.7 - br * 0.5, sy = 1 - c.sq + br;
    const tilt = moving ? Math.sin(c.phase) * 4 : 0;
    c.el.style.transform = `translate3d(${(c.x - pb / 2).toFixed(1)}px, ${(c.y - pb).toFixed(1)}px, 0)`;
    c.rig.style.transform = `translateY(${(-(c.lift + bob + lev)).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${(c.facing * s * sx).toFixed(3)}, ${(s * sy).toFixed(3)})`;
    c.el.style.zIndex = String(Math.round(c.y) + 1);
    if (c.circle) c.circle.style.transform = `scale(${s.toFixed(3)})`;
    c.shadow.style.transform = `scale(${(s * (1 - Math.min(0.45, (c.lift + lev) / (ps * 0.9)))).toFixed(3)})`;
    c.bub.style.bottom = Math.round(pb * s * 0.82 + c.lift + 8) + 'px';
    if (t >= c.blinkAt) { c.blinkEnd = t + 0.13; c.blinkAt = t + rand(2.2, 5.5); }
    if (c.happyT > 0) c.happyT -= dt;
    const eyes = asleep || t < c.blinkEnd ? 'closed' : c.happyT > 0 ? 'happy' : o.energy < 15 ? 'half' : 'normal';
    const mouth = asleep ? 'o' : c.happyT > 0 ? 'open' : o.food < 20 || o.joy < 25 ? 'frown' : 'smile';
    const face = eyes + mouth;
    if (face !== c.face) { c.face = face; c.svg.setAttribute('data-eyes', eyes); c.svg.setAttribute('data-mouth', mouth); }
    if (c.bubT > 0) { c.bubT -= dt; if (c.bubT <= 0) c.bub.hidden = true; }
    if (c.leg && !asleep) { const fly = c.lift > 4; c.legPh += dt * (fly ? 17 : moving ? 9 : 3.2); legMove(c.leg, t + c.i, c.legPh, fly ? 24 : moving ? 14 : 8); }
  }
}
function hitComp(x, y) {
  let best = null, bz = -1;
  for (const c of comps) {
    const s = otherScale(c.o), cx = c.x, cy = c.y - c.lift - (c.lev || 0) - pb * s * 0.37;
    const rx = Math.max(28, pb * s * 0.33), ry = Math.max(30, pb * s * 0.37);
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1 && c.y > bz) { bz = c.y; best = c; }
  }
  return best;
}
function tapComp(c) {
  const o = c.o;
  if (o.asleep || st.lightsOff) { c.bub.innerHTML = `${esc(o.name)} is asleep`; }
  else {
    compHop(c, ps * 0.16); sfx.boop(); c.happyT = 1.6;
    o.joy = Math.min(100, o.joy + 2); o.pats++;
    spawnFx('heart', c.x, c.y - pb * otherScale(o) * 0.7);
    c.bub.innerHTML = `<span>${esc(o.name)}</span><button class="bub-btn" type="button" data-sw="${c.i}">Play</button>`;
  }
  c.bub.hidden = false; c.bub.classList.remove('pop'); void c.bub.offsetWidth; c.bub.classList.add('pop');
  c.bubT = 3.2;
}
/* make another pet the one you play with; the current one becomes a companion where the other stood */
function switchPet(i) {
  if (!st || !st.others[i] || evolving) return;
  if (act) endActivity(true);
  if (ball) removeBall();
  foods.slice().forEach(removeFood);
  hideBubble();
  const c = comps.find(q => q.i === i), px = pet.x, py = pet.y;
  const cur = packPet(), next = st.others[i];
  st.others[i] = cur;
  unpackPet(next);
  if (st.party && !st.party.includes(cur.uid)) { st.party = st.party.filter(u => u !== next.uid); st.party.unshift(cur.uid); st.party = st.party.slice(0, PARTY_MAX - 1); } else if (st.party) st.party = st.party.filter(u => u !== next.uid).concat([cur.uid]).slice(0, PARTY_MAX - 1);
  unperch(); pet.use = null; pet.goal = null; pet.zOver = 0; pet.lift = 0; pet.liftV = 0; pet.hover = 0; pet.hoverT = 0;
  if (c) { pet.x = c.x; pet.y = c.y; }
  pet.stageS = petScaleTarget();
  buildPet(true); renderDecor(); buildCompanions();
  const nc = comps.find(q => q.i === i); if (nc) { nc.x = px; nc.y = py; nc.goal = null; }
  levelSeen = 0;
  if (st.asleep || st.lightsOff) setMode('sleep');
  else { setMode('idle'); jump(ps * 0.25); hearts(2); setFace({ eyes: 'happy', mouth: 'open' }, 1.2); }
  updateHud(); updateHint(); saveSoon();
  sfx.chirp();
  toast(`Now playing with ${st.name}`);
}

/* ---------- the pets strip on the card, and the egg shop ---------- */
/* a compact grid of pets for pickers: small art, stars, element dot; sorted by stars then level */
function pocketGridHTML(list, o) {
  o = o || {};
  const rows = list.slice().sort((a, b) => (o.sort === false ? 0 : (starsOf(b.p.rarity) - starsOf(a.p.rarity)) || ((b.p.dlv || 1) - (a.p.dlv || 1))));
  return `<div class="pocket-grid${o.cls ? ' ' + o.cls : ''}">${rows.map(({ p, i }) => { const el = petElement(p), E = E8[el], cur = o.cur ? o.cur(p, i) : false, dis = o.disabled ? o.disabled(p, i) : false; return `<button class="pk-pet${cur ? ' cur' : ''}${o.on && o.on(p, i) ? ' on' : ''}" type="button" ${o.attr ? o.attr(p, i) : ''}${dis ? ' aria-disabled="true"' : ''} aria-label="${esc(p.name)}, ${E.name}, ${starsOf(p.rarity)} stars, level ${p.dlv || 1}" title="${esc(p.name)}"><span class="pk-art">${petSVG(formOf(p), { frame: 'fit' })}</span><i class="pk-el" style="--ec:${E.color}"></i>${starsHTML(starsOf(p.rarity), 'pk-stars')}<b>${esc(p.name)}</b>${o.badge ? o.badge(p, i) : ''}</button>`; }).join('')}</div>`;
}
function petStripHTML() {
  const party = partyPets(), rest = st.others.filter(p => !party.includes(p)).length;
  const all = [{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i })).filter(x => party.includes(x.p)));
  const pocket = rest ? `<button class="ps-pet ps-add ps-pocket" type="button" data-go="pocket"><span class="ps-art">${ICON.sparkle}</span><b>Pocket</b><small>${rest} resting</small></button>` : '';
  const tiles = all.map(({ p, i }) => `<button class="ps-pet${i < 0 ? ' cur' : ''}" type="button" ${i < 0 ? 'aria-current="true"' : `data-go="pet-sw" data-i="${i}"`} aria-label="${esc(p.name)}${i < 0 ? ', playing now' : ', switch to this pet'}"><span class="ps-art">${petSVG(formOf(p), { frame: 'fit', eyes: p.asleep ? 'closed' : 'normal', mouth: p.asleep ? 'o' : 'smile' })}</span><b>${esc(p.name)}</b><small>${p.asleep ? 'Asleep' : p.food < 25 ? 'Hungry' : evoReadyOf(p) ? 'Can evolve' : `Stage ${p.stage}`}</small></button>`).join('');
  const add = st.others.length < MAX_PETS - 1 ? `<button class="ps-pet ps-add" type="button" data-go="egg"><span class="ps-art">${ICON.egg}</span><b>New egg</b><small>Hatch a pet</small></button>` : '';
  const fuse = st.others.length ? `<button class="ps-pet ps-add ps-fuse" type="button" data-go="fusion"><span class="ps-art">${ICON.fusion}</span><b>Fuse</b><small>${st.fusionStones ? `${st.fusionStones} stone${st.fusionStones > 1 ? 's' : ''}` : 'Two become one'}</small></button>` : '';
  return `<div class="pet-strip" role="list">${tiles}${pocket}${add}${fuse}</div>`;
}
/* the pocket dimension: every pet you own, with the party marked; tap one to play with it */
function openPocket() {
  const party = partyPets(), list = [{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i })));
  const grid = pocketGridHTML(list, { cur: p => p === st, on: p => party.includes(p), attr: (p, i) => i < 0 ? 'aria-current="true"' : `data-go="pet-sw" data-i="${i}"`, badge: p => party.includes(p) ? `<em class="pk-badge">${p === st ? 'YOU' : 'P' + party.indexOf(p)}</em>` : '' });
  openSheet('pocket', `
    <p class="eyebrow">Pocket dimension</p><h2 class="title" id="sheetTitle">Your pets</h2>
    <p class="note">The four party pets live in the house and walk the town; the rest rest here, safe and happy. Tap a pet to play with it (it joins the party). ${petCount()} of ${MAX_PETS} pets.</p>
    <button class="btn primary tm-open" type="button" data-go="team">${ICON.team}Team: set the party, every pet's abilities and accessories</button>
    ${grid}
    <div class="box"><div class="box-top"><span>Fusion Stones</span><span class="mono">${st.fusionStones || 0}</span></div><p class="note">Each fusion uses one. A stone costs ${FUSION_COST} crystals; you have ${fmtNum(st.crystals || 0)}.</p>
      <div class="evo-actions"><button class="btn primary" type="button" data-go="stone-buy"${(st.crystals || 0) < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}Buy a Fusion Stone · ${FUSION_COST}</button><button class="btn" type="button" data-go="crystals">${ICON.crystal}Get crystals</button></div></div>
    <div class="evo-actions"><button class="btn" type="button" data-go="fusion">${ICON.fusion}Fuse pets</button><button class="btn" type="button" data-go="summon">${ICON.egg}Summon eggs</button></div>`);
}
function openEggShop() {
  const full = petCount() >= MAX_PETS;
  openSheet('egg', `
    <p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">Mystery egg</h2>
    <div class="egg-hero">${eggSVG()}</div>
    <p class="note">Every egg hatches a one-of-a-kind pet: its own body, colours, personality and space ability. It moves into your house and plays with your other pets.</p>
    ${full ? `<p class="note"><b>Your house is full.</b> You can keep up to ${MAX_PETS} pets.</p>` : `<div class="packs egg-buy">
      <button class="pack" type="button" data-go="egg-buy">${ICON.egg}<b>Mystery egg</b><span class="mono">$4.00</span></button>
      <button class="pack" type="button" data-go="egg-pearls"${st.pearls < EGG_PEARLS ? ' aria-disabled="true"' : ''}>${ICON.pearl}<b>${EGG_PEARLS} pearls</b><span class="mono">You have ${fmtNum(st.pearls)}</span></button>
    </div>`}
    <div class="evo-actions"><button class="btn primary" type="button" data-go="summon">${ICON.egg}Summon with crystals · ${SUMMON_N} eggs for ${fmtNum(SUMMON_COST)}</button></div>
    <p class="note">You have ${petCount()} of ${MAX_PETS} pets. Odds per egg: ${starsHTML(3)} 85% · ${starsHTML(4)} 10% · ${starsHTML(5)} 5%.</p>
    <p class="demo-note">Prototype: the $4.00 button is a test purchase and nothing is charged. In the real app it opens the App Store or Google Play payment sheet. Pearls are earned by playing.</p>`);
}
const EGG_PEARLS = 300;
function confirmEggBuy() {
  openSheet('egg', `
    <p class="eyebrow">Test purchase</p><h2 class="title" id="sheetTitle">Buy a mystery egg?</h2>
    <div class="egg-hero small">${eggSVG()}</div>
    <p class="note">In the store version this charges <b>$4.00</b> through the App Store or Google Play. This prototype charges nothing.</p>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="egg-confirm">Get the egg</button><button class="btn" type="button" data-go="egg">Back</button></div>`);
}
let adopting = false;
function startAdopt(how) {
  if (!st || petCount() >= MAX_PETS) return;
  if (how === 'pearls') {
    if (st.pearls < EGG_PEARLS) { openPearlShop(EGG_PEARLS - st.pearls); return; }
    st.pearls -= EGG_PEARLS; updateHud();
  }
  closeSheet();
  if (act) endActivity(true);
  if (ball) removeBall();
  if (decorating) exitDecor();
  closeTray();
  saveLocalNow();
  adopting = true;
  showIntro();
  $('#introEyebrow').textContent = 'A new egg for your house';
  $('#introTitle').textContent = 'A mystery egg!';
  $('#introSub').textContent = 'Tap it to crack it open. Your new Cocopet moves in with the others.';
}
function adoptPet(name, genome) {
  adopting = false;
  st.others.push(packPet());
  unpackPet(newPetFields(name, genome));
  running = true;
  introEl.hidden = true;
  appEl.classList.add('playing');
  layout();
  const p = clampXY(W * 0.5, B.y0 + (B.y1 - B.y0) * 0.55);
  pet.x = p[0]; pet.y = p[1]; pet.goal = null; pet.perch = 0; pet.perchZ = 0; pet.lift = 0; pet.zOver = 0;
  pet.stageS = petScaleTarget();
  setMode('idle');
  st.asleep = false;
  buildPet(true); renderDecor(); buildCompanions();
  lastStatAt = Date.now(); levelSeen = 0;
  updateHud(); updateRoomBar(); updateHint();
  setTimeout(() => { if (running) { jump(ps * 0.22); hearts(3); sfx.yum(); } }, 300);
  toast(`Welcome home, ${name}! Tap the name tag to switch between pets.`, 3800);
  saveLocalNow(); Store.touch();
}

/* ---------- the Tower party: up to four pets go in together; you play one and switch between them ---------- */
const PARTY_MAX = 4;
function partyPets() {
  if (!st) return [];
  if (!st.party) st.party = st.others.slice(0, PARTY_MAX - 1).map(p => p.uid);
  const list = [st];
  st.party.forEach(u => { const o = st.others.find(p => p.uid === u); if (o && list.length < PARTY_MAX && !list.includes(o)) list.push(o); });
  return list;
}
function inParty(uid) { return partyPets().some(p => p.uid === uid); }
function togglePartyPet(uid) {
  partyPets();
  if (uid === st.uid) return false;   // the pet you play is always in
  const i = st.party.indexOf(uid);
  if (i >= 0) st.party.splice(i, 1); else { if (st.party.length >= PARTY_MAX - 1) return false; st.party.push(uid); }
  saveSoon(); return true;
}
