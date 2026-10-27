/* ---------- particles ---------- */
let fxCount = 0;
function spawnFx(kind, x, y, o) {
  o = o || {};
  if (fxCount > 50) return;
  if (reduceMotion && kind !== 'z' && kind !== 'ripple' && Math.random() < 0.5) return;
  const el = document.createElement('div');
  el.className = 'fx fx-' + kind;
  el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
  el.style.setProperty('--dx', (o.dx != null ? o.dx : rand(-26, 26)).toFixed(1) + 'px');
  el.style.setProperty('--dy', (o.dy != null ? o.dy : rand(-72, -50)).toFixed(1) + 'px');
  el.style.setProperty('--rot', rand(-25, 25).toFixed(0) + 'deg');
  if (kind === 'heart') el.innerHTML = ICON.heartFx;
  else if (kind === 'sparkle') el.innerHTML = ICON.sparkle;
  else if (kind === 'note') el.innerHTML = ICON.note;
  else if (kind === 'paw') el.innerHTML = ICON.paw;
  else if (kind === 'z') el.textContent = 'z';
  fxEl.appendChild(el); fxCount++;
  let gone = false;
  const done = () => { if (gone) return; gone = true; el.remove(); fxCount--; };
  el.addEventListener('animationend', done, { once: true });
  setTimeout(done, 3000);
}
function floatText(text, x, y, icon) {
  const el = document.createElement('div');
  el.className = 'fx fx-text';
  el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
  el.textContent = text;
  if (icon) el.insertAdjacentHTML('beforeend', icon);
  fxEl.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}
function hearts(n) {
  for (let i = 0; i < n; i++) setTimeout(() => { if (running) spawnFx('heart', pet.x + rand(-0.3, 0.3) * pb * pet.scale, headY() + 6); }, i * 120);
}
function sparkles(n) {
  n = n || 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    spawnFx('sparkle', pet.x, pet.y - pet.perch - pb * pet.scale * 0.4, { dx: Math.cos(a) * ps * 0.8, dy: Math.sin(a) * ps * 0.9 });
  }
}
let markerEl = null;
function tapMark(x, y, tx, ty) {
  spawnFx('ripple', x, y);
  if (tx == null) return;
  clearMarker(false);
  markerEl = document.createElement('div');
  markerEl.className = 'marker'; markerEl.innerHTML = ICON.paw;
  markerEl.style.left = tx.toFixed(1) + 'px'; markerEl.style.top = ty.toFixed(1) + 'px';
  markerEl.style.zIndex = String(Math.round(ty) - 1);
  worldEl.appendChild(markerEl);
}
function clearMarker(withSparkle) {
  if (!markerEl) return;
  if (withSparkle) spawnFx('sparkle', parseFloat(markerEl.style.left), parseFloat(markerEl.style.top) - 6, { dx: 0, dy: -30 });
  markerEl.remove(); markerEl = null;
}

/* ---------- food ---------- */
const foods = [];
function makeFood(type, x, y, inBowl) {
  const el = document.createElement('div');
  el.className = 'food';
  el.innerHTML = `<div class="food-drop"><div class="food-bite">${SNACK_SVG[type]}</div></div>`;
  worldEl.appendChild(el);
  const bw = bowlDecor();
  const f = { type, x, y, inBowl, ox: inBowl && bw ? (x - bw.x) / bw.w : 0, bites: 0, el, bite: $('.food-bite', el) };
  foods.push(f);
  posFood(f);
  while (foods.length > 5) removeFood(foods[0]);
  return f;
}
function posFood(f) {
  const bw = bowlDecor();
  if (f.inBowl && bw) { f.x = bw.x + f.ox * bw.w; f.y = bw.y - bw.h * 0.48; }
  f.el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0)`;
  f.el.style.zIndex = String(Math.round(f.inBowl && bw ? bw.y + 1 : f.y));
}
function removeFood(f) {
  const i = foods.indexOf(f);
  if (i >= 0) foods.splice(i, 1);
  f.el.remove();
  if (pet.eatFood === f) pet.eatFood = null;
}
function nearestFood() {
  let best = null, bd = Infinity;
  for (const f of foods) { const d = hyp(f.x - pet.x, f.y - pet.y); if (d < bd) { bd = d; best = f; } }
  return best;
}
function giveSnack(type, at) {
  const s = SNACKS[type];
  if (s && (s.farm || s.drink || s.rare)) {
    if (!(st.pantry[type] > 0)) { toast(s.drink ? `No ${s.name.toLowerCase()} left. Energy drinks come in gift boxes (Adventure, then Tower).` : s.rare ? `No ${s.name.toLowerCase()} left. The Shop sells it, treasure boxes hold it, and Tower monsters sometimes drop it.` : `No ${s.name.toLowerCase()} in the pantry yet. Grow them on a farm (House, then Build).`, 3400); sfx.wrong(); return; }
    st.pantry[type]--; if (!st.pantry[type]) delete st.pantry[type];
  } else if (s && s.cost) {
    if (st.coins < s.cost) { toast(`${s.name} costs ${s.cost} coins. Activities earn coins.`); sfx.wrong(); return; }
    st.coins -= s.cost; updateHud();
  }
  let f;
  const bw = bowlDecor();
  if (at || !bw) { const p = clampXY(at ? at.x : pet.x + pet.facing * ps * 0.7, at ? at.y : pet.y + 4); f = makeFood(type, p[0], p[1], false); }
  else f = makeFood(type, bw.x + rand(-0.14, 0.14) * bw.w, bw.y - bw.h * 0.48, true);
  sfx.pop();
  noticeFood(f);
}
function noticeFood(f) {
  if ((st.asleep || pet.mode === 'sleep') && !st.lightsOff && (st.food < 85 || SNACKS[f.type].drink)) {
    setTimeout(() => { if (running && st.asleep && !st.lightsOff) { wake(false); bubble('bang', 0.9); } }, 700);
    return;
  }
  if (st.asleep || pet.mode === 'carried' || pet.mode === 'eat' || pet.mode === 'sleep' || (act && act.ownsPet)) return;
  if (st.food >= 92 && !SNACKS[f.type].drink) { refuse(); return; }
  bubble('bang', 0.9);
  goEat(f);
}
function standSpot(f) {
  const s = pet.scale, bw = bowlDecor();
  if (f.inBowl && bw) {
    const side = pet.x < bw.x ? -1 : 1;
    let x = bw.x + side * (bw.w * 0.5 + pb * s * 0.16);
    if (x > B.x1 || x < B.x0) x = bw.x - side * (bw.w * 0.5 + pb * s * 0.16);
    return clampXY(x, bw.y - 1);
  }
  const side = pet.x < f.x ? -1 : 1;
  return clampXY(f.x + side * pb * 0.26 * s, f.y + 2);
}
function goEat(f) { const p = standSpot(f); setGoal('food', p[0], p[1], true, f); }
function startEat(f) {
  if (!f || !foods.includes(f)) { setMode('idle'); return; }
  if (st.food >= 95 && !SNACKS[f.type].drink) { refuse(); return; }
  setMode('eat'); pet.eatFood = f; pet.lastBite = 0; pet.facing = f.x >= pet.x ? 1 : -1;
}
function updateEat() {
  const f = pet.eatFood;
  if (!f || !foods.includes(f)) { setMode('idle'); return; }
  const T = pet.modeT;
  setFace({ eyes: 'happy', mouth: Math.floor(T / 0.16) % 2 ? 'open' : 'chew' }, 0.15);
  if (f.bites < 3 && T - pet.lastBite >= 0.55) {
    pet.lastBite = T; f.bites++;
    f.bite.style.transform = 'scale(' + Math.max(0.15, 1 - f.bites * 0.3).toFixed(2) + ')';
    sfx.chomp(); buzz(8);
    for (let i = 0; i < 3; i++) spawnFx('crumb', f.x + rand(-8, 8), f.y - 12);
  }
  if (f.bites >= 3 && T - pet.lastBite > 0.35) finishEat(f);
}
function finishEat(f) {
  const info = SNACKS[f.type];
  removeFood(f); pet.eatFood = null;
  const foodie = st.dna.personality === 'foodie' ? 1.5 : 1, kitchen = roomType() === 'kitchen';
  st.food += info.food * (kitchen ? 1.25 : 1); st.joy += info.joy * foodie * (kitchen ? 1.25 : 1);
  if (info.energy) { st.energy += info.energy; floatText(`+${info.energy} energy`, pet.x, headY() - 26, ICON.bolt); sparkles(8); }
  clampStats(st);
  st.meals++;
  const first = registerMeal();
  doneTip('feed');
  react('happy', 0.7, { soft: true }); jump(ps * 0.14); hearts(2); sfx.yum();
  addXP(6 + (info.xp || 0) + (kitchen ? 4 : 0));
  if (info.xp) { floatText(`+${info.xp + (kitchen ? 4 : 0)} growth`, pet.x, headY() - 10); sparkles(6); }
  if (info.bondLv) { addXP(bondFoodXP(st, info.bondLv)); floatText(`+${info.bondLv} bond levels`, pet.x, headY() - 10, ICON.heart); hearts(6); sparkles(10); }
  const fx = foodXP(f.type), ups = dunAddXP(fx); floatText(info.lvAdd ? `+${ups} pet levels` : `+${fx} level XP`, pet.x, headY() - 42, ICON.sparkle); if (ups) { toast(`${st.name} is level ${st.dlv}!`, 2600); sfx.fanfare(); }
  if (first) {
    const extra = streakReward();
    setTimeout(() => {
      if (!running) return;
      toast(extra || (st.streak > 1 ? `Fed ${st.streak} days in a row` : 'First meal today. Come back tomorrow for day 2'), extra ? 3600 : 2800);
      sparkles(); sfx.sparkle();
    }, 500);
  } else if (st.food >= 95) setTimeout(() => { if (running) bubble('full', 1.6); }, 700);
  saveSoon(); updateHud();
}
function refuse() { react('refuse', 0.9, { soft: true }); bubble('full', 1.6); sfx.grumble(); }

/* ---------- ball ---------- */
let ball = null;
function ballBounds() { return { x0: B.x0 - ps * 0.25, x1: B.x1 + ps * 0.25, y0: B.y0 - ps * 0.1, y1: B.y1 + 4 }; }
function sizeBall() {
  if (!ball) return;
  ball.r = Math.round(ps * 0.17);
  ball.el.style.width = ball.el.style.height = (ball.r * 2) + 'px';
  ball.sh.style.width = (ball.r * 2) + 'px'; ball.sh.style.height = (ball.r * 0.7) + 'px';
}
function spawnBall() {
  const el = document.createElement('div'); el.className = 'ball'; el.innerHTML = BALL_SVG;
  const sh = document.createElement('div'); sh.className = 'ball-shadow';
  worldEl.append(sh, el);
  ball = { x: clamp(pet.x + pet.facing * ps * 0.8, B.x0, B.x1), y: clamp(pet.y + 6, B.y0, B.y1), z: ps * 1.1, vx: 0, vy: 0, vz: 0, r: 18, el, sh, spin: 0, held: false, touchedAt: now() - 10, spinEl: $('.ball-spin', el) };
  sizeBall(); sfx.pop();
}
function removeBall() {
  if (!ball) return;
  spawnFx('puff', ball.x, ball.y - ball.r - ball.z, { dx: 0 });
  ball.el.remove(); ball.sh.remove(); ball = null;
  if (pet.goal && pet.goal.kind === 'ball') { pet.goal = null; setMode('idle'); }
}
function toggleBall() {
  if (ball) { removeBall(); toast('Ball put away'); }
  else { spawnBall(); if (!st.tips.play) toast('Flick the ball with your finger'); }
}
const ballSpeed = () => ball ? hyp(ball.vx, ball.vy) : 0;
function wantsBall() {
  return !!ball && !ball.held && !st.asleep && st.energy > 10 && pet.kickStreak < 6 && !(act && act.ownsPet) &&
    (ballSpeed() > 30 || ball.z > 4 || now() - ball.touchedAt < 3.5);
}
function chaseBall() { setGoal('ball', ball.x, ball.y, true); }
function tryKick() {
  if (!ball || ball.held || pet.kickCd > 0 || ball.z > ps * 0.25) return;
  const reach = Math.max(26, pb * 0.34 * pet.scale) + ball.r * 0.5;
  if (hyp(ball.x - pet.x, ball.y - pet.y) > reach) return;
  const ang = Math.atan2(ball.y - pet.y, (ball.x - pet.x) || pet.facing) + rand(-0.7, 0.7);
  const sp = rand(380, 640) * (0.7 + st.joy / 330);
  ball.vx = Math.cos(ang) * sp; ball.vy = Math.sin(ang) * sp * 0.8; ball.vz = rand(200, 380);
  pet.kickCd = 0.55; pet.kickStreak++; st.kicks++;
  st.joy = Math.min(100, st.joy + 2.5 * (st.dna.personality === 'playful' ? 1.5 : 1)); st.energy = Math.max(0, st.energy - 1);
  jump(ps * 0.1); sfx.kick(); buzz(6);
  if (Math.random() < 0.35) hearts(1);
  if (Math.random() < 0.3) addCoins(1 * coinMul(), ball.x, ball.y - ball.r * 2);
  addXP(2);
  if (pet.kickStreak >= 6) { pet.goal = null; setMode('idle'); pet.think = 4; bubble('hand', 2.4); }
  saveSoon();
}
function updateBall(dt) {
  if (!ball) return;
  if (ball.held) { ball.z += (ps * 0.22 - ball.z) * (1 - Math.exp(-dt * 12)); return; }
  ball.vz -= 1700 * dt; ball.z += ball.vz * dt;
  if (ball.z <= 0) {
    ball.z = 0;
    if (ball.vz < -140) { ball.vz = -ball.vz * 0.5; if (ball.vz > 160) sfx.bounce(0.2); } else ball.vz = 0;
  }
  const f = Math.exp(-(ball.z > 0.5 ? 0.25 : 1.5) * dt);
  ball.vx *= f; ball.vy *= f;
  if (ball.z === 0 && hyp(ball.vx, ball.vy) < 6) ball.vx = ball.vy = 0;
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  const b = ballBounds();
  if (ball.x < b.x0) { ball.x = b.x0; ball.vx = Math.abs(ball.vx) * 0.7; }
  if (ball.x > b.x1) { ball.x = b.x1; ball.vx = -Math.abs(ball.vx) * 0.7; }
  if (ball.y < b.y0) { ball.y = b.y0; ball.vy = Math.abs(ball.vy) * 0.7; }
  if (ball.y > b.y1) { ball.y = b.y1; ball.vy = -Math.abs(ball.vy) * 0.7; }
  ball.spin += (ball.vx / Math.max(8, ball.r)) * dt * 57.3;
}
function renderBall() {
  if (!ball) return;
  ball.el.style.transform = `translate3d(${(ball.x - ball.r).toFixed(1)}px, ${(ball.y - ball.r * 2 - ball.z).toFixed(1)}px, 0)`;
  ball.el.style.zIndex = String(Math.round(ball.y) + 3);
  ball.spinEl.setAttribute('transform', `rotate(${(ball.spin % 360).toFixed(1)} 20 20)`);
  const k = 1 - Math.min(0.6, ball.z / (ps * 1.6));
  ball.sh.style.transform = `translate3d(${(ball.x - ball.r).toFixed(1)}px, ${(ball.y - ball.r * 0.35).toFixed(1)}px, 0) scale(${k.toFixed(2)})`;
  ball.sh.style.zIndex = String(Math.round(ball.y) - 1);
}
function grabBall() { ball.held = true; ball.vx = ball.vy = ball.vz = 0; sfx.pop(); }
function releaseBall() {
  ball.held = false;
  const t = performance.now();
  const s = ptr.samples.filter(p => t - p.t < 110);
  let vx = 0, vy = 0;
  if (s.length >= 2) {
    const a = s[0], b = s[s.length - 1], d = Math.max(0.016, (b.t - a.t) / 1000);
    vx = (b.x - a.x) / d; vy = (b.y - a.y) / d;
  }
  const sp = hyp(vx, vy), max = 1900;
  if (sp > max) { vx *= max / sp; vy *= max / sp; }
  if (sp > 120) { ball.vx = vx; ball.vy = vy; ball.vz = clamp(sp * 0.22, 120, 480); doneTip('play'); sfx.whoosh(); }
  else { ball.vx = vx * 0.3; ball.vy = vy * 0.3; ball.vz = 60; }
  ball.touchedAt = now(); pet.kickStreak = 0;
}
function tossBall() {
  ball.held = false; ball.vz = 340; ball.vx = rand(-60, 60); ball.vy = rand(-40, 40);
  ball.touchedAt = now(); pet.kickStreak = 0; doneTip('play'); sfx.boop();
}

/* ---------- activities ---------- */
let act = null;
function setBanner(title, stat, btn) {
  $('#bannerTitle').textContent = title;
  $('#bannerStat').textContent = stat || '';
  $('#bannerBtn').textContent = btn || 'End';
  bannerEl.hidden = false;
  hintEl.hidden = true;
}
function bannerStat(s) { const el = $('#bannerStat'); if (el.textContent !== s) el.textContent = s; }
function startActivity(id) {
  if (!running) return;
  closeTray();
  if (decorating) exitDecor();
  if (act) endActivity(true);
  if (id === 'ball') { toggleBall(); return; }
  /* games tire the pet out a little, so a worn-out pet needs a nap before more play */
  const needs = { bubbles: 12, catch: 12, tricks: 12, seek: 12, dig: 15 }[id];
  if (needs && st.energy < needs) {
    if (!st.asleep && pet.mode !== 'sleep') { react('yawn', 1.2, { soft: true }); sfx.sleepy(); }
    toast(`${st.name} is too sleepy to play. A nap in bed will recharge them.`, 3400);
    return;
  }
  if (st.asleep || pet.mode === 'sleep') {
    if (st.lightsOff) setLights(false); else wake(false);
    toast(`${st.name} wakes up for some fun`);
    setTimeout(() => { if (running && !act && !st.asleep) startActivity(id); }, 1400);
    return;
  }
  if (ball) removeBall();
  if (pet.mode === 'carried' || pet.mode === 'eat') { toast(`${st.name} is busy. Try again in a moment.`); return; }
  ({ bubbles: startBubbles, catch: startCatch, dig: startTreasure, tricks: startTricks, seek: startSeek, bath: startBath, brush: startBrush })[id]();
  syncDock();
}
function endActivity(silent) {
  if (!act) return;
  const a = act;
  act = null;
  try { if (a.cleanup) a.cleanup(); } catch (e) {}
  bannerEl.hidden = true;
  $('#trickCard').hidden = true;
  $('#seekCover').hidden = true;
  if (!silent && a.result) showResult(a.result);
  updateHint(); syncDock(); saveSoon();
}
function finish(result) { if (!act) return; act.result = result; endActivity(false); }
function showResult(r) {
  const box = $('#result');
  box.innerHTML = `<h2 id="resultTitle">${esc(r.title)}</h2>${r.sub ? `<p>${esc(r.sub)}</p>` : ''}<ul class="rewards">${r.lines.map(l => `<li>${l[0] || ''}<span>${esc(l[1])}</span></li>`).join('')}</ul><button class="btn primary wide" id="resultOk" type="button">Nice!</button>`;
  $('#resultWrap').hidden = false;
  sfx.sparkle();
  const ok = $('#resultOk');
  ok.onclick = () => { $('#resultWrap').hidden = true; };
  setTimeout(() => { try { ok.focus({ preventScroll: true }); } catch (e) {} }, 50);
}
function rewardLines(coins, xp, extra) {
  const L = [];
  if (coins > 0) L.push([ICON.coin, `+${coins} coins`]);
  if (xp > 0) L.push([ICON.heart, `+${xp} bond`]);
  return L.concat(extra || []);
}
function relayoutPlay() {
  foods.forEach(posFood);
  if (ball) { const b = ballBounds(); ball.x = clamp(ball.x, b.x0, b.x1); ball.y = clamp(ball.y, b.y0, b.y1); sizeBall(); }
  if (act && act.relayout) act.relayout();
}
$('#bannerBtn').addEventListener('click', () => { if (act && act.onBtn) act.onBtn(); else endActivity(false); });

/* bubbles: pop them before they float away */
function startBubbles() {
  const a = { id: 'bubbles', t: 0, dur: 20, spawn: 0, list: [], pops: 0, coins: 0, ownsPet: false };
  const sc = ps / 110;
  const pop = (b, byPet) => {
    if (b.gone) return;
    b.gone = true; b.el.classList.add('popping');
    setTimeout(() => b.el.remove(), 240);
    a.list = a.list.filter(x => x !== b);
    a.pops++; st.pops++;
    sfx.bubble(); spawnFx('sparkle', b.x, b.y, { dx: rand(-14, 14), dy: rand(-30, -10) });
    const c = Math.round((byPet ? 2 : 1) * coinMul());
    a.coins += c; addCoins(c, b.x, b.y - b.r);
    st.joy = Math.min(100, st.joy + (byPet ? 1.5 : 0.8) * (st.dna.personality === 'playful' ? 1.5 : 1));
  };
  a.update = dt => {
    a.t += dt; a.spawn -= dt;
    if (a.t < a.dur && a.spawn <= 0) {
      a.spawn = rand(0.45, 0.85);
      const r = rand(14, 24) * sc, el = document.createElement('div');
      el.className = 'bub'; el.style.width = el.style.height = (r * 2).toFixed(0) + 'px';
      worldEl.appendChild(el);
      const x0 = rand(B.x0, B.x1);
      a.list.push({ x: x0, x0, y: B.y1 + 20, r, vy: -rand(45, 75) * sc, ph: rand(0, 6), el, groundY: B.y1 });
    }
    for (const b of a.list.slice()) {
      b.y += b.vy * dt; b.x = b.x0 + Math.sin(b.ph + a.t * 1.7) * 18;
      b.groundY = clamp(b.y + ps * 0.9, B.y0, B.y1);
      b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0)`;
      if (b.y < hudB + b.r + 24) { b.gone = true; b.el.classList.add('popping'); setTimeout(() => b.el.remove(), 240); a.list = a.list.filter(x => x !== b); }
    }
    if (canCommand() && (pet.mode === 'idle' || (pet.mode === 'move' && pet.goal && pet.goal.kind === 'wander'))) {
      let best = null;
      for (const b of a.list) if (b.y > wallH - ps * 0.6 && (!best || b.y > best.y)) best = b;
      if (best) setGoal('bubble', best.x, best.groundY, true, best);
    }
    if (pet.goal && pet.goal.kind === 'bubble') {
      const b = pet.goal.ref;
      if (b && !b.gone && Math.abs(b.x - pet.x) < pb * pet.scale * 0.42 && b.y > headY() - ps * 0.7 && b.y < pet.y) { jump(ps * 0.28); pop(b, true); pet.goal = null; setMode('idle'); pet.think = 0.3; }
    }
    bannerStat(`${a.pops} popped · ${Math.max(0, Math.ceil(a.dur - a.t))}s`);
    if (a.t >= a.dur && !a.list.length) done();
  };
  /* ending early keeps what you earned; the +10 bonus is for playing the whole round */
  const done = () => {
    const xp = a.t >= a.dur || a.pops ? (a.t >= a.dur ? 10 : 0) + a.pops : 0;
    if (xp > 0) addXP(xp);
    st.energy = Math.max(0, st.energy - 4);
    finish({ title: 'Bubble time!', sub: `${a.pops} bubbles popped`, lines: rewardLines(a.coins, xp) });
  };
  a.onBtn = () => { if (a.pops > 0) done(); else endActivity(true); };
  a.onDown = (x, y) => {
    for (const b of a.list) if (hyp(x - b.x, y - b.y) < b.r + 14) { pop(b, false); return true; }
    return false;
  };
  a.cleanup = () => { a.list.forEach(b => b.el.remove()); if (pet.goal && pet.goal.kind === 'bubble') { pet.goal = null; setMode('idle'); } };
  act = a;
  setBanner('Bubbles', '', 'End');
  toast('Pop the bubbles before they float away');
}

/* treat catch: slide your pet under falling snacks, dodge the socks */
const CATCH_TYPES = [
  { id: 'berries', v: 1, w: 30 }, { id: 'cookie', v: 1, w: 25 }, { id: 'fish', v: 2, w: 20 }, { id: 'star', v: 5, w: 7 }, { id: 'sock', v: -3, w: 18 },
];
function startCatch() {
  unperch(); pet.use = null; pet.goal = null; ptr.kind = null;
  const a = { id: 'catch', t: 0, dur: 30, spawn: 0.9, items: [], score: 0, caught: 0, ownsPet: true, tx: pet.x };
  setMode('catch');
  a.lineY = () => B.y1 - 4;
  a.update = dt => {
    a.t += dt; a.spawn -= dt;
    const sc = ps / 110;
    if (a.t < a.dur && a.spawn <= 0) {
      a.spawn = Math.max(0.36, 0.9 - a.t * 0.017);
      const tp = wpick(Math.random, CATCH_TYPES), el = document.createElement('div');
      el.className = 'fall'; el.innerHTML = SNACK_SVG[tp.id];
      worldEl.appendChild(el);
      a.items.push({ tp, el, x: rand(B.x0, B.x1), y: hudB + 6, vy: (150 + a.t * 5) * sc, rot: rand(-30, 30), vr: rand(-120, 120) });
    }
    pet.y += (a.lineY() - pet.y) * Math.min(1, dt * 10);
    const sp = ps * 5, dx = a.tx - pet.x;
    pet.vx = clamp(dx * 9, -sp, sp); pet.vy = 0;
    pet.x = clamp(pet.x + pet.vx * dt, B.x0, B.x1);
    if (Math.abs(pet.vx) > 12) { pet.facing = pet.vx > 0 ? 1 : -1; pet.phase += dt * Math.abs(pet.vx) / ps * 7; }
    const top = pet.y - pb * pet.scale * 0.72, bot = pet.y - pb * pet.scale * 0.12;
    for (const it of a.items.slice()) {
      it.y += it.vy * dt; it.rot += it.vr * dt;
      it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0) rotate(${it.rot.toFixed(0)}deg)`;
      if (it.y >= top && it.y <= bot && Math.abs(it.x - pet.x) < pb * pet.scale * 0.4) {
        a.items = a.items.filter(x => x !== it); it.el.remove();
        a.score = Math.max(0, a.score + it.tp.v);
        if (it.tp.v > 0) {
          a.caught++; st.catches++;
          setFace({ eyes: 'happy', mouth: 'open' }, 0.35); sfx.chomp(); st.food = Math.min(100, st.food + 1);
          floatText(`+${it.tp.v}`, it.x, it.y - 20);
          if (it.tp.id === 'star') { sparkles(6); sfx.sparkle(); }
        } else {
          setFace({ eyes: 'dizzy', mouth: 'pout' }, 0.6); sfx.wrong(); floatText('-3', it.x, it.y - 20);
        }
      } else if (it.y > pet.y + 30) { a.items = a.items.filter(x => x !== it); it.el.remove(); }
    }
    bannerStat(`Score ${a.score} · ${Math.max(0, Math.ceil(a.dur - a.t))}s`);
    if (a.t >= a.dur && !a.items.length) done();
  };
  const done = () => {
    const coins = Math.round(a.score * coinMul()), xp = a.t >= a.dur || a.caught ? (a.t >= a.dur ? 10 : 0) + a.caught * 2 : 0;
    st.coins += coins; if (xp > 0) addXP(xp);
    st.energy = Math.max(0, st.energy - 6);
    finish({ title: a.score >= 25 ? 'Snack champion!' : 'Treat catch', sub: `Score ${a.score}`, lines: rewardLines(coins, xp) });
  };
  a.onBtn = () => { if (a.score > 0 || a.caught > 0) done(); else endActivity(true); };
  a.onDown = x => { a.tx = x; return true; };
  a.onMove = x => { a.tx = x; return true; };
  a.onUp = () => true;
  a.cleanup = () => { a.items.forEach(it => it.el.remove()); if (pet.mode === 'catch') setMode('idle'); };
  act = a;
  setBanner('Treat catch', '', 'End');
  toast('Drag left and right to catch treats. Dodge the socks!');
}

/* treasure dig: where gemstones come from */
function fmtWait(petHours) {
  const real = petHours / (st.fast ? FAST : 1);
  if (real < 1 / 60) return Math.max(1, Math.ceil(real * 3600)) + ' s';
  const mins = Math.ceil(real * 60);
  if (mins < 60) return mins + ' min';
  return Math.floor(mins / 60) + ' h' + (mins % 60 ? ' ' + (mins % 60) + ' min' : '');
}
function startTreasure() {
  if (st.digWait > 0) { toast(`The garden is still settling. Dig again in ${fmtWait(st.digWait)}.`, 3200); return; }
  if (st.energy < 15) { toast(`${st.name} is too tired to dig. Try a nap first.`); return; }
  const a = { id: 'dig', mounds: [], dug: 0, total: 5, coins: 0, pearls: 0, gems: [], socks: 0, idx: 0, gotGem: false, ownsPet: false };
  let guard = 0;
  while (a.mounds.length < a.total && guard++ < 200) {
    const x = rand(B.x0, B.x1), y = rand(B.y0 + 10, B.y1 - 6);
    if (a.mounds.some(m => hyp(m.x - x, m.y - y) < ps * 0.75)) continue;
    if (decor.some(d => d.def.place === 'floor' && Math.abs(d.x - x) < d.w * 0.45 && y < d.y + 14 && y > d.y - d.h * 0.4)) continue;
    const el = document.createElement('div'); el.className = 'mound'; el.innerHTML = MOUND_SVG;
    el.style.width = (ps * 0.62).toFixed(0) + 'px'; el.style.height = (ps * 0.3).toFixed(0) + 'px';
    el.style.marginLeft = (-ps * 0.31).toFixed(0) + 'px'; el.style.marginTop = (-ps * 0.27).toFixed(0) + 'px';
    el.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`; el.style.zIndex = String(Math.round(y) - 1);
    worldEl.appendChild(el);
    a.mounds.push({ x, y, el, dug: false });
  }
  a.total = a.mounds.length;
  a.update = () => { bannerStat(`${a.total - a.dug} left`); };
  a.onDown = (x, y) => {
    const m = a.mounds.find(q => !q.dug && Math.abs(x - q.x) < ps * 0.4 && y > q.y - ps * 0.4 && y < q.y + ps * 0.15);
    if (!m) return false;
    if (pet.mode === 'dig' || !canCommand()) return true;
    a.mounds.forEach(q => q.el.classList.remove('hint'));
    m.el.classList.add('hint');
    const side = pet.x < m.x ? -1 : 1;
    const p = clampXY(m.x + side * pb * pet.scale * 0.22, m.y + 2);
    setGoal('mound', p[0], p[1], true, m);
    return true;
  };
  a.cleanup = () => { a.mounds.forEach(m => m.el.remove()); if (pet.mode === 'dig') setMode('idle'); };
  a.onBtn = () => { if (a.dug > 0) { st.digWait = 3; digResult(a); } else endActivity(true); };
  act = a;
  setBanner('Treasure dig', '', 'End');
  toast('Tap a mound and your pet digs it up');
}
function startDig(m) {
  if (!act || act.id !== 'dig' || !m || m.dug) { setMode('idle'); return; }
  setMode('dig'); pet.digM = m; pet.facing = m.x >= pet.x ? 1 : -1; pet.digBeat = 0;
}
function updateDig(dt) {
  const m = pet.digM, dur = st.stage >= 4 ? 0.85 : 1.3;
  if (!m || !act || act.id !== 'dig') { setMode('idle'); return; }
  const T = pet.modeT;
  pet.squash = 0.12 + Math.sin(T * 26) * 0.08;
  setFace({ eyes: 'closed', mouth: 'open' }, 0.15);
  pet.digBeat -= dt;
  if (pet.digBeat <= 0) {
    pet.digBeat = 0.16;
    spawnFx('dirt', m.x + rand(-10, 10), m.y - 8, { dx: -pet.facing * rand(20, 60) });
    if (Math.random() < 0.5) sfx.dig();
  }
  if (T >= dur) finishDig(m);
}
function rollDig(a) {
  const e = evoStatus(), need = e && !e.gemOk ? e.nx.gem : null;
  const curious = st.dna.personality === 'curious';
  a.idx++;
  if (need && !a.gotGem) {
    let chance = e.bondOk ? 0.35 : 0.06;
    if (curious) chance *= 1.4;
    if ((e.bondOk && a.idx >= 3) || Math.random() < chance) { a.gotGem = true; st.gems[need] = (st.gems[need] || 0) + 1; return { kind: 'gem', gem: need }; }
  }
  const r = Math.random();
  if (r < (curious ? 0.1 : 0.07)) { const n = randi(1, 2); st.pearls += n; return { kind: 'pearl', n }; }
  if (r < 0.2) return { kind: 'sock' };
  const n = Math.round(randi(8, 30) * coinMul() * (curious ? 1.3 : 1) * (isOutdoor() ? 1.5 : 1));
  st.coins += n;
  return { kind: 'coins', n };
}
function finishDig(m) {
  const a = act;
  m.dug = true; a.dug++; st.digs++;
  m.el.classList.add('gone');
  setTimeout(() => m.el.remove(), 650);
  st.energy = Math.max(0, st.energy - 5); st.clean = Math.max(0, st.clean - 10);
  const r = rollDig(a);
  const fy = m.y - ps * 0.5;
  if (r.kind === 'gem') {
    a.gems.push(r.gem);
    floatText(`${GEMS[r.gem].name}!`, m.x, fy); sparkles(10); sfx.fanfare();
    react('happy', 1.2, { soft: true }); jump(ps * 0.3); bubble('yay', 1.6);
  } else if (r.kind === 'pearl') {
    a.pearls += r.n; floatText(`+${r.n}`, m.x, fy, ICON.pearl); sfx.sparkle(); react('happy', 0.6, { soft: true });
  } else if (r.kind === 'sock') {
    a.socks++; floatText('An old sock', m.x, fy); sfx.wrong(); react('confused', 0.8, { soft: true });
  } else {
    a.coins += r.n; floatText(`+${r.n}`, m.x, fy, ICON.coin); sfx.coin(); react('happy', 0.5, { soft: true });
  }
  addXP(8); updateHud(); saveSoon();
  if (a.dug >= a.total || st.energy < 8) { st.digWait = 3; setTimeout(() => { if (act === a) digResult(a); }, 1100); }
}
function digResult(a) {
  const extra = a.gems.map(g => [gemSVG(g), `Found a ${GEMS[g].name}!`]);
  if (a.pearls) extra.push([ICON.pearl, `+${a.pearls} pearls`]);
  if (a.socks) extra.push(['', `${a.socks} old sock${a.socks > 1 ? 's' : ''} (for the laundry)`]);
  const e = evoStatus();
  const sub = a.gems.length && e && e.gemOk ? (e.bondOk ? 'You have the gemstone. Time to evolve!' : `Keep bonding to reach level ${e.nx.bond}, then evolve.`) : `${st.name} is muddy. A bath would help.`;
  finish({ title: a.gems.length ? 'Treasure!' : 'Treasure dig', sub, lines: rewardLines(a.coins, 8 * a.dug, extra) });
  if (e && e.gemOk && e.bondOk) syncEvoBadge();
}

/* tricks: gestures on the floor become moves */
/* stars come with practice across days: 3, 8, 15, 25 and 40 performances */
const TRICK_STEPS = [3, 8, 15, 25, 40];
const trickStars = id => TRICK_STEPS.filter(n => (st.tricks[id] || 0) >= n).length;
function renderTrickCard() {
  $('#trickList').innerHTML = TRICKS.map(t => {
    const locked = st.stage < t.stage, s = trickStars(t.id);
    return `<div class="trick${locked ? ' locked' : ''}"><div><b>${t.name}</b><span>${locked ? `Stage ${t.stage}` : t.how}</span></div>${locked ? '' : `<span class="stars" aria-label="${s} of 5 stars">${'★'.repeat(s)}${'☆'.repeat(5 - s)}</span>`}</div>`;
  }).join('');
  $('#trickCard').hidden = false;
}
function startTricks() {
  unperch(); pet.use = null;
  const a = { id: 'tricks', ownsPet: false, path: [], lastTap: 0, done: 0, coins: 0, xp: 0 };
  a.onDown = (x, y) => { a.path = [{ x, y, t: now() }]; a.onPet = hitPet(x, y, 1.2); return true; };
  a.onMove = (x, y) => { const l = a.path[a.path.length - 1]; if (!l || hyp(x - l.x, y - l.y) > 6) a.path.push({ x, y, t: now() }); return true; };
  a.onUp = (x, y) => {
    a.path.push({ x, y, t: now() });
    const g = classifyGesture(a.path);
    if (g === 'tap') {
      if (a.onPet) { if (now() - a.lastTap < 0.45) { a.lastTap = 0; performTrick('five', a); } else a.lastTap = now(); }
      else tapMark(x, y);
      return true;
    }
    const map = { up: pet.lift > 12 ? 'flip' : 'jump', longup: 'float', circle: 'spin', circle2: 'starfall', down: 'roll' };
    if (map[g]) performTrick(map[g], a); else { bubble('what', 1); }
    return true;
  };
  a.onBtn = () => {
    if (a.done) { finish({ title: 'Training done', sub: `${a.done} tricks performed`, lines: rewardLines(a.coins, a.xp) }); }
    else endActivity(true);
  };
  a.cleanup = () => { if (pet.mode === 'trick') setMode('idle'); };
  act = a;
  renderTrickCard();
  setBanner('Tricks', 'Gesture on the floor', 'Done');
}
function classifyGesture(path) {
  if (path.length < 2) return 'tap';
  const p0 = path[0], p1 = path[path.length - 1];
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  let len = 0;
  for (let i = 1; i < path.length; i++) len += hyp(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  if (len < 14) return 'tap';
  let turn = 0;
  for (let i = 2; i < path.length; i++) {
    const a1 = Math.atan2(path[i - 1].y - path[i - 2].y, path[i - 1].x - path[i - 2].x);
    const a2 = Math.atan2(path[i].y - path[i - 1].y, path[i].x - path[i - 1].x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    turn += d;
  }
  if (Math.abs(turn) > Math.PI * 3.4) return 'circle2';
  if (Math.abs(turn) > Math.PI * 1.5) return 'circle';
  if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.2) return dy < -200 ? 'longup' : 'up';
  if (dy > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) return 'down';
  return 'other';
}
function performTrick(id, a) {
  const t = TRICKS.find(x => x.id === id);
  if (pet.mode === 'trick' && id !== 'flip') return;
  if (st.stage < t.stage) { react('confused', 0.8, { soft: true }); bubble('what', 1.2); toast(`${t.name} unlocks at stage ${t.stage} (${STAGES[t.stage].name})`); return; }
  if (st.energy < 8) { react('yawn', 1.2, { soft: true }); sfx.sleepy(); toast(`${st.name} is worn out. Tap Done and let them rest.`); return; }
  /* 70% at no stars, rising with practice to 97% at five stars */
  const chance = Math.min(0.97, 0.7 + trickStars(id) * 0.06);
  if (Math.random() > chance) {
    react('confused', 0.8, { soft: true }); bubble('what', 1.2); sfx.wrong();
    if (!a.missTip) { a.missTip = true; toast(`Not quite! ${st.name} gets more reliable as each trick earns stars.`, 3200); }
    return;
  }
  pet.goal = null;
  const before = trickStars(id);
  setMode('trick');
  pet.trick = { id, dur: { jump: 0.8, flip: 0.8, spin: 1.0, roll: 0.9, five: 0.9, float: 1.9, starfall: 1.6 }[id] };
  if (id === 'jump') { jump(ps * 0.42); sfx.boop(); }
  if (id === 'flip') { pet.liftV = Math.max(pet.liftV, 520); sfx.whoosh(); }
  if (id === 'spin') sfx.giggle();
  if (id === 'roll') sfx.whoosh();
  if (id === 'five') { spawnFx('paw', pet.x + pet.facing * pb * pet.scale * 0.3, headY() - 10, { dx: 0, dy: -40 }); sfx.pop(); setTimeout(() => sfx.boop(), 90); }
  if (id === 'float') { pet.hoverT = 1.7; sfx.hum(); }
  if (id === 'starfall') { sfx.sparkle(); sparkles(14); }
  st.tricks[id] = (st.tricks[id] || 0) + 1;
  const c = Math.round(2 * coinMul());
  a.done++; a.coins += c; a.xp += 5;
  st.coins += c; addXP(5); st.energy = Math.max(0, st.energy - 1);
  floatText(`+${c}`, pet.x, headY() - 26, ICON.coin);
  if (trickStars(id) > before) toast(`${t.name}: ${'★'.repeat(trickStars(id))}`);
  renderTrickCard(); saveSoon();
}
function updateTrick() {
  const tr = pet.trick;
  if (!tr) { setMode('idle'); return; }
  const T = pet.modeT, p = clamp(T / tr.dur, 0, 1);
  setFace({ eyes: 'happy', mouth: 'open' }, 0.15);
  switch (tr.id) {
    case 'flip': pet.rot = -360 * p * pet.facing; break;
    case 'spin': pet.facing = Math.floor(T / 0.1) % 2 ? 1 : -1; break;
    case 'roll': pet.rot = 360 * p * pet.facing; pet.squash = 0.1; setFace({ eyes: 'closed', mouth: 'open' }, 0.15); break;
    case 'five': pet.rot = -10 * pet.facing * Math.sin(p * Math.PI); break;
    case 'starfall': pet.facing = Math.floor(T / 0.12) % 2 ? 1 : -1; pet.rot = Math.sin(T * 12) * 6; if (Math.random() < 0.3) spawnFx('sparkle', pet.x + rand(-40, 40), headY() + rand(-20, 30)); break;
  }
  if (T >= tr.dur) { pet.rot = 0; pet.trick = null; setMode('idle'); pet.think = 2; if (Math.random() < 0.5) hearts(1); }
}

/* hide and seek: the pet hides behind your furniture */
function startSeek() {
  const spots = decor.filter(d => d.def.hide && d.def.place === 'floor');
  if (spots.length < 2) { toast('Hide and seek needs 2 or more big pieces of furniture, like plants or a toy chest. Get them in Decor.', 4200); return; }
  unperch(); pet.use = null; pet.goal = null;
  spots.sort((p, q) => q.h - p.h);
  const spot = pick(spots.slice(0, Math.max(2, Math.ceil(spots.length * 0.7))));
  const a = { id: 'seek', phase: 'count', guesses: 0, spot, ownsPet: true, t: 0, hintT: 4 };
  const cover = $('#seekCover');
  cover.hidden = false;
  const count = n => { cover.innerHTML = `${n > 0 ? n : 'Ready or not!'}<small>${st.name} is hiding…</small>`; };
  count(3);
  [2, 1, 0].forEach((n, i) => setTimeout(() => { if (act === a) count(n); }, (i + 1) * 800));
  setTimeout(() => {
    if (act !== a) return;
    pet.x = clamp(spot.x + rand(-0.12, 0.12) * spot.w, B.x0, B.x1);
    pet.y = clamp(spot.y - 3, B.y0, B.y1);
    pet.zOver = Math.max(2, Math.round(spot.y) - 2);
    pet.facing = Math.random() < 0.5 ? 1 : -1; pet.lift = 0; pet.liftV = 0;
    setMode('hidden');
    cover.hidden = true; a.phase = 'seek';
    setBanner('Hide & seek', '3 guesses left', 'Give up');
  }, 3000);
  const reveal = found => {
    a.phase = 'done';
    st.energy = Math.max(0, st.energy - 4);
    pet.zOver = 0;
    pet.y = clamp(spot.y + 8, B.y0, B.y1);
    jump(ps * 0.3); setMode('react'); pet.react = { kind: 'happy', dur: 1.2, soft: true, then: null };
    if (found) {
      bubble('found', 1.6); hearts(3); sfx.yum();
      const coins = Math.round(Math.max(5, 20 - 6 * a.guesses) * coinMul()), xp = 20;
      st.coins += coins; st.seeks++; addXP(xp);
      setTimeout(() => finish({ title: 'Found it!', sub: a.guesses ? `Found on guess ${a.guesses + 1}` : 'First try!', lines: rewardLines(coins, xp) }), 900);
    } else {
      bubble('ha', 1.6); sfx.giggle();
      st.coins += 4; addXP(8);
      setTimeout(() => finish({ title: `${st.name} wins!`, sub: `It was behind the ${spot.def.name.toLowerCase()}`, lines: rewardLines(4, 8) }), 900);
    }
  };
  a.update = dt => {
    if (a.phase !== 'seek') return;
    a.hintT -= dt;
    if (a.hintT <= 0 && st.dna.personality !== 'shy') { a.hintT = 4.5; spot.el.classList.remove('wiggle'); void spot.el.offsetWidth; spot.el.classList.add('wiggle'); }
  };
  a.onDown = (x, y) => {
    if (a.phase !== 'seek') return true;
    const d = decorAt(x, y);
    if (!d || d.def.place === 'wall') { tapMark(x, y); return true; }
    if (d === spot || hitPet(x, y)) { reveal(true); return true; }
    a.guesses++;
    d.el.classList.remove('shake'); void d.el.offsetWidth; d.el.classList.add('shake');
    sfx.wrong(); floatText('Not here', x, y - 20);
    bannerStat(`${3 - a.guesses} guess${3 - a.guesses === 1 ? '' : 'es'} left`);
    if (a.guesses >= 3) reveal(false);
    return true;
  };
  a.onBtn = () => { if (a.phase === 'seek') reveal(false); else endActivity(true); };
  a.cleanup = () => { pet.zOver = 0; spot.el.classList.remove('wiggle'); if (pet.mode === 'hidden') { pet.y = clamp(spot.y + 8, B.y0, B.y1); setMode('idle'); } };
  act = a;
  setBanner('Hide & seek', 'Counting…', 'Give up');
}

/* bath: scrub up a lather, then rinse */
function startBath() {
  unperch(); pet.use = null; pet.goal = null; ptr.kind = null;
  const tw = ps * 1.7, th = tw * 100 / 160;
  const tx = clamp(W / 2, B.x0, B.x1), ty = clamp(B.y0 + (B.y1 - B.y0) * 0.62, B.y0, B.y1);
  const back = document.createElement('div'), front = document.createElement('div');
  back.className = 'tub'; front.className = 'tub';
  back.innerHTML = TUB_BACK; front.innerHTML = TUB_FRONT;
  [back, front].forEach(el => { el.style.width = tw.toFixed(0) + 'px'; el.style.height = th.toFixed(0) + 'px'; el.style.transform = `translate3d(${(tx - tw / 2).toFixed(0)}px, ${(ty - th).toFixed(0)}px, 0)`; worldEl.appendChild(el); });
  back.style.zIndex = String(Math.round(ty) - 2); front.style.zIndex = String(Math.round(ty) + 6);
  pet.x = tx; pet.y = ty - 1; pet.perch = th * 0.46; pet.perchZ = Math.round(ty) + 3; pet.lift = 0; pet.liftV = 0;
  setMode('bathe');
  sfx.splash();
  const a = { id: 'bath', phase: 'scrub', foam: 0, foams: [], ownsPet: true, last: null, beat: 0 };
  a.update = dt => {
    if (a.phase === 'scrub') { setFace(a.foam > 5 ? { eyes: 'closed', mouth: 'smile' } : { eyes: 'normal', mouth: 'o' }, 0.2); bannerStat(a.foam >= 100 ? 'All soapy!' : `Rub to scrub · ${Math.floor(a.foam)}%`); }
    if (a.phase === 'rinse') {
      a.beat -= dt;
      if (a.beat <= 0) { a.beat = 0.05; spawnFx('drop', pet.x + rand(-0.35, 0.35) * pb * pet.scale, pet.y - pet.perch - pb * pet.scale * 0.95, { dx: 0, dy: 0 }); }
    }
  };
  a.onDown = (x, y) => { a.last = { x, y }; return true; };
  a.onMove = (x, y) => {
    if (a.phase !== 'scrub' || !a.last) return true;
    const d = hyp(x - a.last.x, y - a.last.y);
    a.last = { x, y };
    if (!hitPet(x, y, 1.5)) return true;
    a.foam = Math.min(100, a.foam + d * 0.13);
    st.joy = Math.min(100, st.joy + d * 0.01);
    if (a.foams.length < 30 && Math.random() < 0.35) {
      const el = document.createElement('div'), r = rand(9, 20) * ps / 110;
      el.className = 'foam'; el.style.width = el.style.height = (r * 2).toFixed(0) + 'px';
      const fx = pet.x + rand(-0.32, 0.32) * pb * pet.scale, fy = pet.y - pet.perch - rand(0.1, 0.7) * pb * pet.scale;
      el.style.left = (fx - r).toFixed(0) + 'px'; el.style.top = (fy - r).toFixed(0) + 'px';
      fxEl.appendChild(el); a.foams.push(el);
      if (Math.random() < 0.4) sfx.bubble();
    }
    if (a.foam >= 100 && !a.ready) { a.ready = true; $('#bannerBtn').textContent = 'Rinse'; sfx.chirp(); }
    return true;
  };
  a.onBtn = () => {
    if (a.phase === 'scrub' && a.ready) {
      a.phase = 'rinse';
      bannerStat('Rinsing…');
      const sh = document.createElement('div'); sh.className = 'shower'; sh.innerHTML = SHOWER_SVG;
      sh.style.left = (pet.x - 32).toFixed(0) + 'px'; sh.style.top = (pet.y - pet.perch - pb * pet.scale * 1.2 - 40).toFixed(0) + 'px';
      fxEl.appendChild(sh); a.shower = sh;
      sfx.splash();
      setTimeout(() => a.foams.forEach(el => el.classList.add('out')), 500);
      setTimeout(() => {
        if (act !== a) return;
        const spa = roomType() === 'bathroom', xp = spa ? 30 : 15;
        st.clean = 100; st.baths++;
        st.joy = Math.min(100, st.joy + (spa ? 22 : 8));
        sparkles(10); sfx.sparkle(); addXP(xp);
        finish({ title: 'Squeaky clean!', sub: spa ? `${st.name} loved the proper bathroom` : `${st.name} smells like soap now`, lines: rewardLines(0, xp, [[ICON.drop, 'Cleanliness 100%']].concat(spa ? [[ICON.heart, 'Bathroom bonus: big happiness boost']] : [])) });
      }, 1700);
    } else endActivity(true);
  };
  a.cleanup = () => { back.remove(); front.remove(); a.foams.forEach(el => el.remove()); if (a.shower) a.shower.remove(); pet.perch = 0; pet.perchZ = 0; if (pet.mode === 'bathe') { pet.y = clamp(ty + 10, B.y0, B.y1); setMode('idle'); jump(ps * 0.2); } };
  act = a;
  setBanner('Bath time', '', 'Done');
  toast(`Rub ${st.name} to make bubbles`);
}

/* brushing: like pats, plus shine and a little cleaning */
function startBrush() {
  const a = { id: 'brush', idle: 0, strokes: 0, ownsPet: false };
  a.onDown = (x, y) => { if (hitPet(x, y, 1.3)) { a.brushing = true; a.last = { x, y }; return true; } return false; };
  a.onMove = (x, y) => {
    if (!a.brushing) return false;
    const d = hyp(x - a.last.x, y - a.last.y);
    a.last = { x, y }; rub(d, true); a.idle = 0; a.strokes += d;
    return true;
  };
  a.onUp = () => { const was = a.brushing; a.brushing = false; return !!was; };
  a.update = dt => {
    a.idle += dt;
    const pct = Math.min(100, Math.round(a.strokes / 12));
    bannerStat(`Shine ${pct}%`);
    if (pct >= 100) { addXP(10); st.joy = Math.min(100, st.joy + 5); finish({ title: 'So shiny!', sub: `${st.name}'s fur is gleaming`, lines: rewardLines(0, 10, [[ICON.heart, 'Happiness up']]) }); }
    else if (a.idle > 12) endActivity(true);
  };
  act = a;
  setBanner('Brushing', '', 'Done');
  toast(`Stroke ${st.name} with your finger`);
}
