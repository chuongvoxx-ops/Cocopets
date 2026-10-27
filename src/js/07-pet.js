/* ---------- the pet: body, moods and behaviour ---------- */
const pet = {
  x: 0, y: 0, vx: 0, vy: 0, facing: 1, mode: 'idle', modeT: 0, goal: null, think: 2,
  phase: 0, lift: 0, liftV: 0, perch: 0, perchZ: 0, squash: 0, rot: 0, stretch: 0, stageS: 0.6, scale: 0.6, hover: 0, hoverT: 0,
  look: { x: 0, y: 0 }, lookGoal: null, lookUntil: 0, face: null, faceUntil: 0,
  blinkAt: 2, blinkEnd: 0, tailPhase: 0, wingPhase: 0, react: null, boops: [], rubAcc: 0, lastRub: 0,
  kickCd: 0, kickStreak: 0, stirs: [], needT: 6, zT: 0, eatFood: null, lastBite: 0,
  carryOff: { x: 0, y: 0 }, idleFor: 0, purrT: 0, earT: 0, spinC: null, use: null, trailT: 0, zOver: 0, trick: null, awakeUntil: 0,
};
let parts = {};
let petKey = '';
let acache = {};
const dirtLevel = () => clamp((60 - st.clean) / 60, 0, 0.9);
function buildPet(force) {
  const f = curForm();
  const key = JSON.stringify(f) + '|' + st.stage;
  if (!force && key === petKey) return;
  petKey = key;
  const lf = f.x && f.x.gold && f.stage >= 7 ? f.x.leg : null;
  petEl.innerHTML = `${lf ? magicCircleHTML(lf, f) : ''}<div class="pet-shadow"></div><div class="pet-rig">${petRigHTML(f, { dirt: dirtLevel() })}</div><div class="stink" hidden><i></i><i></i><i></i></div><div class="bubble" hidden></div>`;
  const svg = $('.pet-rig svg', petEl);
  const piv = el => el ? (el.getAttribute('data-pivot') || '0 0') : '0 0';
  parts = {
    svg, rig: $('.pet-rig', petEl), shadow: $('.pet-shadow', petEl), circle: $('.pet-circle', petEl), bubble: $('.bubble', petEl), stink: $('.stink', petEl),
    tail: $('.p-tail', svg), footL: $('.p-foot-l', svg), footR: $('.p-foot-r', svg), earR: $('.p-ear-r', svg),
    armL: $('.p-arm-l', svg), armR: $('.p-arm-r', svg), orbs: $('.p-orbs', svg),
    face: $('.p-face', svg), blink: $('.p-blink', svg), wingL: $('.p-wing-l', svg), wingR: $('.p-wing-r', svg), dirt: $('.p-dirt', svg),
  };
  parts.tailPivot = piv(parts.tail); parts.earPivot = piv(parts.earR); parts.wingPivot = piv(parts.wingL); parts.armPivot = piv(parts.armL);
  parts.eyeY = parts.blink ? +parts.blink.getAttribute('data-ey') || -66 : -66;
  parts.leg = legParts(parts.rig);
  if (parts.orbs) { const o = parts.orbs.getAttribute('data-orbit').split(' ').map(Number); parts.orbit = o; parts.orbEls = $$(':scope > g', parts.orbs); }
  parts.floaty = f.legs.t === 'float';
  // a six-star Legendary at Celestial floats in the air
  parts.levit = !!(f.x && f.x.gold && f.stage >= 7);
  acache = {};
  const g = st.stage >= 2 ? GEMS[STAGE_GEM[st.stage]] : null;
  petEl.style.setProperty('--gem-glow', g ? g.color : '#FFFFFF');
}
function setA(el, key, k, v) { if (el && acache[key] !== v) { acache[key] = v; el.setAttribute(k, v); } }

function setMode(m) { pet.mode = m; pet.modeT = 0; }
function unperch() {
  if (pet.perch > 0) { pet.lift += pet.perch; pet.perch = 0; pet.liftV = Math.max(pet.liftV, 80); }
  pet.perchZ = 0;
}
function setGoal(kind, x, y, run, ref) {
  unperch();
  if (pet.use) pet.use = null;
  pet.goal = { kind, x, y, run: !!run, ref: ref || null, t: now() };
  setMode('move');
}
function canCommand() {
  if (!running || !st || st.asleep) return false;
  const m = pet.mode;
  return m === 'idle' || m === 'move' || m === 'petted' || m === 'spin' || m === 'use' || (m === 'react' && pet.react && pet.react.soft);
}
function speedFor(run) {
  let v = ps * 1.15 * (run ? 2.1 : 1);
  const m = mood();
  if (m === 'hungry' || m === 'tired') v *= 0.62;
  else if (m === 'sad' || m === 'dirty') v *= 0.82;
  else if (m === 'joyful') v *= 1.1;
  return v;
}
function setFace(f, dur) { pet.face = f; pet.faceUntil = now() + dur; }
function baseFace() {
  switch (mood()) {
    case 'asleep': return { eyes: 'closed', mouth: 'o' };
    case 'hungry': return { eyes: 'normal', mouth: 'frown', brows: 'sad' };
    case 'tired': return { eyes: 'half', mouth: 'flat' };
    case 'dirty': return { eyes: 'half', mouth: 'pout', brows: 'sad' };
    case 'sad': return { eyes: 'normal', mouth: 'frown', brows: 'sad' };
    default: return { eyes: 'normal', mouth: 'smile' };
  }
}
function currentFace() {
  const base = Object.assign({ brows: 'none', cheeks: 'normal' }, pet.mode === 'sleep' ? { eyes: 'closed', mouth: 'o' } : baseFace());
  if (pet.face && now() < pet.faceUntil) return Object.assign(base, pet.face);
  return base;
}
const GRAV = 2000;
function jump(h) { if (pet.lift > 2 && pet.liftV > 0) return; pet.liftV = Math.sqrt(2 * GRAV * Math.max(4, h)); }
const headY = () => pet.y - pet.lift - (pet.lev || 0) - pet.perch - pb * pet.scale * 0.62;
function hop() { jump(ps * 0.13); spawnFx('note', pet.x + pet.facing * pb * 0.2 * pet.scale, headY()); }
function physics(dt) {
  if (pet.mode === 'carried') { pet.lift += (ps * 0.28 - pet.lift) * (1 - Math.exp(-dt * 14)); pet.liftV = 0; return; }
  if (pet.lift > 0 || pet.liftV > 0) {
    pet.liftV -= GRAV * dt; pet.lift += pet.liftV * dt;
    if (pet.lift <= 0) {
      pet.lift = 0;
      if (pet.liftV < -260) { pet.squash = clamp(-pet.liftV / 2400, 0.08, 0.32); if (pet.liftV < -650) sfx.bounce(0.3); }
      pet.liftV = 0;
    }
  }
  pet.squash *= Math.exp(-dt * 9);
  if (pet.hoverT > 0) { pet.hoverT -= dt; pet.hover += (ps * 0.3 - pet.hover) * (1 - Math.exp(-dt * 4)); }
  else pet.hover += (0 - pet.hover) * (1 - Math.exp(-dt * 5));
  if (pet.hover < 0.5 && pet.hoverT <= 0) pet.hover = 0;
}

/* ---------- what it does when left alone ---------- */
function updateIdle(dt) {
  const k = Math.exp(-dt * 10); pet.vx *= k; pet.vy *= k;
  if (act && act.ownsPet) return;
  if (wantsBall()) { chaseBall(); return; }
  if (st.food < 92) { const f = nearestFood(); if (f) { goEat(f); return; } }
  if (st.lightsOff) { goToBed(); return; }
  pet.needT -= dt;
  if (pet.needT <= 0) { pet.needT = rand(9, 14); const n = currentNeed(); if (n) bubble(n, 2.6); }
  pet.think -= dt;
  if (pet.think > 0) return;
  pet.think = rand(3, 7);
  if (act) { wander(); return; }
  const m = mood(), night = isNight();
  if (st.energy < 12 || (night && pet.idleFor > 90 && now() > pet.awakeUntil)) { react('yawn', 1.2, { then: goToBed }); sfx.sleepy(); return; }
  const r = Math.random();
  if (st.stage >= 5 && m === 'joyful' && r < 0.12) { pet.hoverT = 2.2; setFace({ eyes: 'happy', mouth: 'open' }, 2.2); return; }
  if (m === 'joyful' && r < 0.2) { startSpin(); return; }
  if (bflies.length && r < 0.42 && st.energy > 25 && chaseButterfly()) return;
  if (r < 0.5) { const d = pickItemToUse(); if (d) { goUse(d); return; } }
  if (!night && sunOn && !isOutdoor() && st.energy < 65 && r < 0.6) { setGoal('sun', sun.cx + rand(-24, 24), sun.cy, false); return; }
  if (r < 0.72) { wander(); return; }
  if (r < 0.82) { lookAround(); return; }
  if (r < 0.88 && st.energy < 55) { react('yawn', 1.1, { soft: true }); sfx.sleepy(); return; }
  hop();
}
function wander() {
  const p = clampXY(pet.x + rand(-0.4, 0.4) * W, pet.y + rand(-0.22, 0.22) * H);
  setGoal('wander', p[0], p[1], false);
}
function lookAround() {
  pet.lookGoal = { x: rand(-1, 1), y: rand(-0.6, 0.4) }; pet.lookUntil = now() + 1.6;
  if (Math.random() < 0.4) pet.facing *= -1;
}
const USE_W = { play: 1.5, sit: 1, warm: 1, sniff: 1, cactus: 0.6, drink: 1.2, watch: 1.2, climb: 1.4 };
function pickItemToUse() {
  const P = st.dna.personality;
  const list = decor.filter(d => d.def.place === 'floor' && USE_W[d.def.act]);
  if (!list.length) return null;
  const opts = list.map(d => {
    let w = USE_W[d.def.act];
    if (P === 'playful' && (d.def.act === 'play' || d.def.act === 'climb')) w *= 2.2;
    if (P === 'sleepy' && (d.def.act === 'sit' || d.def.act === 'warm')) w *= 2.2;
    if (P === 'curious' && (d.def.act === 'sniff' || d.def.act === 'watch')) w *= 2.2;
    return { d, w };
  });
  return wpick(Math.random, opts).d;
}
function useSpot(d) {
  const flipK = d.it.flip ? -1 : 1, spot = d.def.spot || [0.5, 1];
  if (d.def.act === 'sleep' || d.def.act === 'sit' || d.def.act === 'climb') {
    return { x: d.x + (spot[0] - 0.5) * d.w * flipK, y: Math.min(d.y + 1, B.y1), perch: (1 - spot[1]) * d.h, z: Math.round(d.y) + 4 };
  }
  const side = pet.x < d.x ? -1 : 1;
  let x = d.x + side * (d.w * 0.5 + pb * pet.scale * 0.18);
  if (x < B.x0 || x > B.x1) x = d.x - side * (d.w * 0.5 + pb * pet.scale * 0.18);
  return { x, y: Math.min(d.y + 2, B.y1), perch: 0, z: 0 };
}
function goUse(d) { const sp = useSpot(d); setGoal('use', sp.x, sp.y, false, d); }
const USE_DUR = { play: 3, sniff: 1.6, cactus: 1.1, sit: 5, climb: 4.5, drink: 2.4, watch: 3.5, warm: 5 };
function startUse(d) {
  if (!decor.includes(d)) { setMode('idle'); return; }
  const sp = useSpot(d), a = d.def.act;
  pet.facing = d.x >= pet.x ? 1 : -1;
  if (sp.perch) {
    pet.x = sp.x; pet.y = clamp(sp.y, B.y0, B.y1);
    pet.lift = 0; pet.liftV = 0; pet.perch = sp.perch; pet.perchZ = sp.z; pet.squash = 0.2;
  }
  if (a === 'sleep' && (st.lightsOff || st.energy < 80 || isNight())) { fallAsleep(d); return; }
  const kind = a === 'sleep' ? 'sit' : a;
  pet.use = { d, act: kind, t: 0, beat: 0, dur: USE_DUR[kind] || 2 };
  setMode('use');
  if (a === 'sleep') { hop(); bubble('yay', 1); }
  if (a === 'play') d.el.classList.add('wiggle');
  if (a === 'cactus') { setFace({ eyes: 'normal', mouth: 'o' }, 0.5); }
  if (a === 'climb') { sfx.boop(); }
}
function updateUse(dt) {
  const u = pet.use;
  if (!u || !decor.includes(u.d)) { pet.use = null; unperch(); setMode('idle'); return; }
  u.t += dt; u.beat -= dt;
  const d = u.d;
  switch (u.act) {
    case 'play':
      setFace({ eyes: 'happy', mouth: 'open' }, 0.2);
      if (u.beat <= 0) { u.beat = 0.7; hop(); d.el.classList.remove('wiggle'); void d.el.offsetWidth; d.el.classList.add('wiggle'); st.joy = Math.min(100, st.joy + 1.5); if (Math.random() < 0.3) hearts(1); }
      break;
    case 'sniff':
      setFace({ eyes: 'closed', mouth: 'o' }, 0.2);
      if (u.t > u.dur - 0.05 && !u.done) {
        u.done = true;
        if (Math.random() < 0.35) { react('happy', 0.5, { soft: true }); bubble('achoo', 1.2); jump(ps * 0.1); spawnFx('puff', pet.x + pet.facing * pb * 0.25 * pet.scale, headY() + 10); sfx.grumble(); }
      }
      break;
    case 'cactus':
      if (u.t > 0.5 && !u.done) { u.done = true; bubble('ouch', 1.2); jump(ps * 0.18); pet.vx = -pet.facing * ps * 2; setFace({ eyes: 'wide', mouth: 'o' }, 0.9); sfx.squeak(); }
      if (u.done) { pet.x = clamp(pet.x + pet.vx * dt, B.x0, B.x1); pet.vx *= Math.exp(-dt * 6); }
      break;
    case 'sit': case 'warm':
      setFace({ eyes: u.act === 'warm' ? 'closed' : 'happy', mouth: 'smile' }, 0.2);
      st.joy = Math.min(100, st.joy + dt * 0.6); st.energy = Math.min(100, st.energy + dt * 0.5);
      if (u.act === 'warm' && isNight() && u.t > 3) { pet.use = null; fallAsleep(null); return; }
      break;
    case 'climb':
      setFace({ eyes: 'happy', mouth: 'smile' }, 0.2);
      if (u.beat <= 0) { u.beat = 1.4; pet.facing *= -1; }
      break;
    case 'drink':
      setFace({ eyes: 'closed', mouth: Math.floor(u.t / 0.2) % 2 ? 'o' : 'chew' }, 0.2);
      if (u.beat <= 0) { u.beat = 0.6; spawnFx('drop', pet.x + pet.facing * pb * 0.18 * pet.scale, headY() + 14, { dx: 0, dy: 0 }); }
      if (u.t > u.dur - 0.05 && !u.done) { u.done = true; st.joy = Math.min(100, st.joy + 3); }
      break;
    case 'watch':
      pet.lookGoal = { x: d.x > pet.x ? 1 : -1, y: -0.2 }; pet.lookUntil = now() + 0.3;
      if (u.beat <= 0) { u.beat = 1.2; spawnFx('note', pet.x, headY()); st.joy = Math.min(100, st.joy + 1); }
      break;
  }
  if (u.t >= u.dur) endUse();
}
function endUse() {
  const u = pet.use;
  pet.use = null;
  if (u && u.d) u.d.el.classList.remove('wiggle');
  if (pet.perch) { unperch(); }
  setMode('idle'); pet.think = rand(2, 4);
}
function updateMove(dt) {
  const g = pet.goal;
  if (!g) { setMode('idle'); return; }
  let tx = g.x, ty = g.y, arriveR = 6;
  if (g.kind === 'follow') {
    if (ptr.kind !== 'follow') g.kind = 'tap';
    else { tx = ptr.x; ty = ptr.y; arriveR = ps * 0.18; }
  }
  if (g.kind === 'ball') {
    if (!ball || ball.held || !wantsBall()) {
      pet.goal = null; setMode('idle'); pet.think = rand(1.5, 3);
      if (ball && pet.kickStreak >= 6) bubble('hand', 2.4);
      return;
    }
    tx = ball.x + ball.vx * 0.18; ty = ball.y + ball.vy * 0.18; arriveR = 1;
    tryKick();
    if (!pet.goal) return;
  }
  if (g.kind === 'bubble') {
    const b = g.ref;
    if (!b || b.gone) { pet.goal = null; setMode('idle'); pet.think = 0.2; return; }
    tx = b.x; ty = clamp(b.groundY, B.y0, B.y1); arriveR = ps * 0.12;
  }
  if (g.kind === 'food' && !foods.includes(g.ref)) { pet.goal = null; setMode('idle'); return; }
  if (g.kind === 'use' && !decor.includes(g.ref)) { pet.goal = null; setMode('idle'); return; }
  const p = clampXY(tx, ty); tx = p[0]; ty = p[1];
  const dx = tx - pet.x, dy = ty - pet.y, d = hyp(dx, dy);
  if (d <= arriveR) {
    const k = Math.exp(-dt * 12); pet.vx *= k; pet.vy *= k;
    if (g.kind === 'follow') { if (Math.abs(ptr.x - pet.x) > 4) pet.facing = ptr.x > pet.x ? 1 : -1; return; }
    if (g.kind === 'ball' || g.kind === 'bubble') return;
    arrive(g); return;
  }
  const sp = speedFor(g.run) * clamp(d / (ps * 0.5), 0.3, 1);
  const k = 1 - Math.exp(-dt * 8);
  pet.vx += (dx / d * sp - pet.vx) * k; pet.vy += (dy / d * sp - pet.vy) * k;
  let nx = pet.x + pet.vx * dt, ny = pet.y + pet.vy * dt;
  if (hyp(nx - pet.x, ny - pet.y) > d) { nx = tx; ny = ty; }
  const q = clampXY(nx, ny); pet.x = q[0]; pet.y = q[1];
  if (Math.abs(pet.vx) > 10) pet.facing = pet.vx > 0 ? 1 : -1;
  pet.phase += dt * (hyp(pet.vx, pet.vy) / ps) * 7.5;
  st.energy = Math.max(0, st.energy - dt * (g.run ? 0.03 : 0.012));
  if (g.kind === 'follow') st.joy = Math.min(100, st.joy + dt * 0.25);
  if (st.stage >= 7 && g.run) { pet.trailT -= dt; if (pet.trailT <= 0) { pet.trailT = 0.08; spawnFx('sparkle', pet.x - pet.facing * pb * 0.2 * pet.scale, pet.y - pb * pet.scale * 0.2, { dx: rand(-8, 8), dy: rand(-20, 0) }); } }
  if (pet.modeT > 8 && g.kind !== 'follow' && g.kind !== 'ball' && g.kind !== 'bubble') arrive(g);
}
function arrive(g) {
  pet.goal = null;
  switch (g.kind) {
    case 'tap':
      setMode('idle'); pet.think = rand(3, 6); clearMarker(true);
      pet.lookGoal = { x: 0, y: 0 }; pet.lookUntil = now() + 2;
      if (Math.random() < 0.55) hop();
      sfx.chirp();
      break;
    case 'food': startEat(g.ref); break;
    case 'use': startUse(g.ref); break;
    case 'sun':
      if (st.energy < 60) fallAsleep(null);
      else { setMode('idle'); setFace({ eyes: 'happy', mouth: 'smile' }, 3); pet.think = rand(4, 7); }
      break;
    case 'mound': startDig(g.ref); break;
    case 'greet': setMode('idle'); greetHop(); break;
    case 'bfly':
      setMode('idle'); pet.think = rand(2, 4); jump(ps * 0.22);
      setFace({ eyes: 'happy', mouth: 'open' }, 1.2); hearts(1); sfx.giggle();
      st.joy = Math.min(100, st.joy + 3); st.energy = Math.max(0, st.energy - 1);
      if (Math.random() < 0.3) addCoins(2, pet.x, headY());
      break;
    case 'window': lookOutside(); break;
    default: setMode('idle'); pet.think = rand(2, 5);
  }
}
function react(kind, dur, opts) {
  opts = opts || {};
  setMode('react');
  pet.react = { kind, dur, soft: !!opts.soft, then: opts.then || null };
  pet.goal = null;
}
function updateReact(dt) {
  const r = pet.react;
  if (!r) { setMode('idle'); return; }
  const T = pet.modeT;
  const k = Math.exp(-dt * 10); pet.vx *= k; pet.vy *= k;
  switch (r.kind) {
    case 'tickle': pet.rot = Math.sin(T * 30) * 6; setFace({ eyes: 'happy', mouth: 'open' }, 0.1); break;
    case 'annoyed': pet.rot = Math.sin(T * 40) * 2; setFace({ eyes: 'normal', brows: 'angry', mouth: 'pout', cheeks: 'puff' }, 0.1); break;
    case 'refuse': pet.rot = Math.sin(T * 18) * 10 * Math.max(0, 1 - T / r.dur); setFace({ eyes: 'closed', mouth: 'flat' }, 0.1); break;
    case 'grumpy': setFace({ eyes: 'half', brows: 'angry', mouth: 'frown' }, 0.1); break;
    case 'stretch': setFace(T < 0.8 ? { eyes: 'closed', mouth: 'open' } : { eyes: 'normal', mouth: 'smile' }, 0.1); pet.stretch = Math.sin(Math.min(1, T / 0.8) * Math.PI) * 0.12; break;
    case 'yawn': setFace({ eyes: 'closed', mouth: 'open' }, 0.1); pet.stretch = Math.sin(Math.min(1, T / r.dur) * Math.PI) * 0.08; break;
    case 'dizzy': pet.rot = Math.sin(T * 6) * 8; setFace({ eyes: 'dizzy', mouth: 'flat' }, 0.1); break;
    case 'happy': setFace({ eyes: 'happy', mouth: 'open' }, 0.1); break;
    case 'sad': setFace({ eyes: 'normal', brows: 'sad', mouth: 'frown' }, 0.1); break;
    case 'confused': pet.rot = Math.sin(Math.min(1, T / 0.3) * Math.PI / 2) * 12; setFace({ eyes: 'normal', mouth: 'o' }, 0.1); break;
    case 'land': if (T < 0.3) setFace({ eyes: 'wide', mouth: 'o' }, 0.1); break;
  }
  if (T >= r.dur) {
    pet.rot = 0; pet.stretch = 0;
    const then = r.then;
    pet.react = null; setMode('idle'); pet.think = rand(1.5, 3.5);
    if (then) then();
  }
}
function startSpin() { setMode('spin'); pet.goal = null; pet.spinC = { x: pet.x, y: pet.y }; sfx.giggle(); }
function updateSpin() {
  const T = pet.modeT;
  pet.facing = Math.floor(T / 0.14) % 2 ? 1 : -1;
  const p = clampXY(pet.spinC.x + Math.sin(T * 9) * 12, pet.spinC.y + Math.cos(T * 9) * 5);
  pet.x = p[0]; pet.y = p[1];
  setFace({ eyes: 'happy', mouth: 'open' }, 0.1);
  if (T > 1.5) react('dizzy', 1.0, { soft: true });
}

/* ---------- sleep ---------- */
function goToBed() {
  if (pet.mode === 'sleep' || (pet.goal && pet.goal.kind === 'use' && pet.goal.ref && pet.goal.ref.def.act === 'sleep')) return;
  const bed = bestBed();
  if (bed) goUse(bed);
  else fallAsleep(null);
}
function fallAsleep(bed) {
  if (!bed) unperch();
  pet.use = null;
  setMode('sleep'); st.asleep = true; pet.vx = pet.vy = 0; pet.zT = 0.6; pet.goal = null;
  hideBubble(); sfx.sleepy(); saveSoon();
}
function updateSleep(dt) {
  pet.zT -= dt;
  if (pet.zT <= 0) { pet.zT = 1.7; spawnFx('z', pet.x + pet.facing * pb * 0.18 * pet.scale, headY() + 6); }
  if (!st.lightsOff && st.energy >= 98 && !isNight()) wake(false);
}
function wake(grumpy) {
  st.asleep = false; pet.idleFor = 0; pet.awakeUntil = now() + 300;
  unperch();
  react(grumpy ? 'grumpy' : 'stretch', grumpy ? 1.4 : 1.3);
  if (grumpy) { sfx.grumble(); spawnFx('puff', pet.x - pb * 0.25 * pet.scale, headY()); }
  else sfx.chirp();
  saveSoon();
}
function stir(n) {
  const t = now();
  pet.stirs = pet.stirs.filter(s => t - s < 4);
  for (let i = 0; i < n; i++) pet.stirs.push(t);
  if (pet.mode !== 'sleep') return;
  if (pet.stirs.length >= 3) {
    pet.stirs = [];
    if (st.lightsOff) setLights(false, true); else wake(true);
    return;
  }
  pet.earT = 0.5; setFace({ eyes: 'closed', mouth: 'flat' }, 0.8); bubble('dots', 1.2); sfx.mumble();
}

/* ---------- touch reactions ---------- */
function startCarry() {
  unperch(); pet.use = null;
  setMode('carried'); pet.goal = null; pet.vx = pet.vy = 0;
  pet.carryOff.x = pet.x - ptr.x; pet.carryOff.y = pet.y - ptr.y;
  sfx.squeak(); buzz(10); setFace({ eyes: 'wide', mouth: 'o' }, 0.6);
}
function updateCarried(dt) {
  const p = clampXY(ptr.x + pet.carryOff.x, ptr.y + pet.carryOff.y);
  const k = 1 - Math.exp(-dt * 18);
  pet.x += (p[0] - pet.x) * k; pet.y += (p[1] - pet.y) * k;
  pet.phase += dt * 16;
  if (pet.modeT > 0.6) setFace(st.joy > 45 ? { eyes: 'happy', mouth: 'smile' } : { eyes: 'normal', mouth: 'frown', brows: 'sad' }, 0.1);
}
function dropPet() { react('land', 0.6, { soft: true }); st.joy = Math.min(100, st.joy + 1); saveSoon(); }
function rub(d, brush) {
  pet.lastRub = now();
  if (pet.mode === 'sleep') setFace({ eyes: 'closed', mouth: 'smile' }, 0.6);
  else if (pet.mode !== 'petted' && pet.mode !== 'eat' && pet.mode !== 'carried' && pet.mode !== 'bathe') { pet.use = null; setMode('petted'); pet.goal = null; pet.vx = pet.vy = 0; }
  pet.rubAcc += d;
  const cuddly = st.dna.personality === 'cuddly' ? 1.6 : 1;
  st.joy = Math.min(100, st.joy + d * 0.022 * cuddly);
  if (brush) st.clean = Math.min(100, st.clean + d * 0.03);
  if (pet.rubAcc >= 65) {
    pet.rubAcc = 0; st.pats++;
    if (brush) for (let i = 0; i < 2; i++) spawnFx('sparkle', pet.x + rand(-0.3, 0.3) * pb * pet.scale, pet.y - pet.perch - rand(0.2, 0.6) * pb * pet.scale, { dx: rand(-14, 14), dy: rand(-30, -10) });
    else hearts(1);
    buzz(5); doneTip('pet'); addXP(1);
    if (now() - pet.purrT > 0.9) { pet.purrT = now(); sfx.purr(); }
    saveSoon();
  }
}
function updatePetted() {
  setFace({ eyes: 'happy', mouth: 'smile' }, 0.1);
  if (now() - pet.lastRub > 0.6) { setMode('idle'); pet.think = rand(2, 4); }
}
function boop() {
  if (pet.mode === 'sleep' || st.asleep) { stir(2); return; }
  if (pet.mode === 'eat') { setFace({ eyes: 'wide', mouth: 'chew' }, 0.3); return; }
  const t = now();
  pet.boops = pet.boops.filter(b => t - b < 2.2);
  pet.boops.push(t);
  const n = pet.boops.length;
  if (n >= 9) { pet.boops = []; annoyed(); return; }
  if (n >= 4) { tickle(); return; }
  if (pet.mode === 'move' || pet.mode === 'spin' || pet.mode === 'petted' || pet.mode === 'use') { pet.use = null; unperch(); pet.goal = null; setMode('idle'); }
  jump(ps * 0.15);
  setFace({ eyes: Math.random() < 0.5 ? 'wide' : 'happy', mouth: 'open' }, 0.5);
  sfx.boop(); buzz(8);
  st.joy = Math.min(100, st.joy + 1.2);
  spawnFx('note', pet.x + pet.facing * pb * 0.2 * pet.scale, headY());
  pet.think = rand(2, 4);
  addXP(1); saveSoon();
}
function tickle() {
  react('tickle', 1.0, { soft: true }); sfx.giggle(); buzz([6, 40, 6]);
  st.joy = Math.min(100, st.joy + 2.5); hearts(1);
}
function annoyed() {
  react('annoyed', 1.4, {
    then: () => {
      const away = pet.x < W / 2 ? 1 : -1;
      const p = clampXY(pet.x + away * W * 0.35, pet.y + rand(-40, 40));
      setGoal('wander', p[0], p[1], true);
    },
  });
  st.joy = Math.max(0, st.joy - 4);
  sfx.grumble();
  spawnFx('puff', pet.x - pb * 0.3 * pet.scale, headY());
  spawnFx('puff', pet.x + pb * 0.3 * pet.scale, headY());
  bubble('angry', 1.4);
  saveSoon();
}
function greet() { const p = clampXY(W / 2, B.y0 + (B.y1 - B.y0) * 0.55); setGoal('greet', p[0], p[1], true); }
function greetHop() {
  jump(ps * 0.2);
  setTimeout(() => { if (running) jump(ps * 0.16); }, 380);
  hearts(3); sfx.yum();
  const n = currentNeed();
  if (n) setTimeout(() => { if (running) bubble(n, 2.6); }, 900);
}

/* ---------- drawing it every frame ---------- */
const hover = { on: false, x: 0, y: 0 };
function updateLook(dt) {
  let gx = 0, gy = 0;
  const touching = ptr.id !== null && ptr.kind !== 'carry';
  if (touching || hover.on) {
    const px = touching ? ptr.x : hover.x, py = touching ? ptr.y : hover.y;
    gx = clamp((px - pet.x) / (ps * 1.4), -1, 1);
    gy = clamp((py - headY()) / (ps * 1.4), -1, 1);
    if (pet.mode === 'idle' && Math.abs(px - pet.x) > ps * 0.5) pet.facing = px > pet.x ? 1 : -1;
  } else if (pet.mode === 'move' || pet.mode === 'catch') { gx = pet.facing * 0.7; gy = 0.15; }
  else if (pet.lookGoal && now() < pet.lookUntil) { gx = pet.lookGoal.x; gy = pet.lookGoal.y; }
  const lx = gx * pet.facing, k = 1 - Math.exp(-dt * 10);
  pet.look.x += (lx - pet.look.x) * k; pet.look.y += (gy - pet.look.y) * k;
}
function updateBlink() {
  const t = now();
  if (t >= pet.blinkAt) { pet.blinkEnd = t + 0.13; pet.blinkAt = t + (Math.random() < 0.18 ? 0.28 : rand(2.2, 5.5)); }
}
function tailParams() {
  if (st.asleep) return [0, 0];
  const m = pet.mode, rk = pet.react && pet.react.kind;
  if (m === 'petted' || m === 'eat' || m === 'spin' || m === 'use' || rk === 'happy' || rk === 'tickle') return [16, 15];
  const md = mood();
  if (md === 'joyful') return [13, 9];
  if (md === 'content') return [9, 5];
  return [3, 2];
}
function renderPet(dt) {
  const t = now();
  const target = petScaleTarget();
  pet.stageS += (target - pet.stageS) * (1 - Math.exp(-dt * 3));
  const depth = 0.88 + 0.12 * clamp((pet.y - B.y0) / Math.max(1, B.y1 - B.y0), 0, 1);
  const s = pet.stageS * depth; pet.scale = s;
  const moving = (pet.mode === 'move' || pet.mode === 'catch') && hyp(pet.vx, pet.vy) > 15;
  const bob = moving && !parts.floaty && !parts.levit ? Math.abs(Math.sin(pet.phase)) * ps * 0.04 : 0;
  const lev = parts.levit ? levitate(t, pet.mode === 'sleep' || st.asleep, pet.perch > 0 || pet.mode === 'carried') : 0;
  pet.lev = lev;
  const hov = (pet.hover > 0 ? pet.hover + Math.sin(t * 3.2) * 3 : 0) + (parts.floaty && pet.mode !== 'sleep' ? 4 + Math.sin(t * 2.4) * 3 : 0) + lev;
  const br = Math.sin(t * (st.asleep ? 1.6 : 2.4)) * (st.asleep ? 0.035 : 0.016);
  const sx = 1 + pet.squash * 0.7 - br * 0.5 - pet.stretch * 0.4, sy = 1 - pet.squash + br + pet.stretch;
  const tilt = (moving ? Math.sin(pet.phase) * 4 : 0) + pet.rot;
  const air = pet.lift + bob + hov;
  const lift = air + pet.perch;
  petEl.style.transform = `translate3d(${(pet.x - pb / 2).toFixed(1)}px, ${(pet.y - pb).toFixed(1)}px, 0)`;
  parts.rig.style.transform = `translateY(${(-lift).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${(pet.facing * s * sx).toFixed(3)}, ${(s * sy).toFixed(3)})`;
  let z = pet.zOver || pet.perchZ || Math.round(pet.y) + 2;
  if (!pet.zOver && !pet.perchZ && pet.mode === 'sleep') { const bed = decor.find(d => d.def.act === 'sleep' && Math.abs(pet.x - d.x) < d.w * 0.5 && pet.y <= d.y + 2 && pet.y > d.y - d.h); if (bed) z = Math.round(bed.y) + 4; }
  petEl.style.zIndex = String(z);
  parts.shadow.style.transform = `translateY(${(-pet.perch).toFixed(1)}px) scale(${(s * (1 - Math.min(0.45, air / (ps * 0.9)))).toFixed(3)})`;
  parts.shadow.style.opacity = (1 - Math.min(0.5, air / (ps * 1.2))).toFixed(2);
  // the magic circle lies on the floor under it, the pet's size, whatever its height
  if (parts.circle) parts.circle.style.transform = `translateY(${(-pet.perch).toFixed(1)}px) scale(${s.toFixed(3)})`;
  parts.bubble.style.bottom = Math.round(pb * s * 0.82 + lift + 8) + 'px';
  parts.stink.hidden = st.clean >= 25 || pet.mode === 'bathe';
  if (!parts.stink.hidden) parts.stink.style.bottom = '';
  let fl = 0, fr = 0;
  // walking: each foot lifts in turn, high enough to see, and shuffles forward and back as it steps
  let sl = 0, sr = 0;
  if (moving) { const a = Math.sin(pet.phase * 2), b = Math.cos(pet.phase * 2); fl = Math.max(0, a) * 8; fr = Math.max(0, -a) * 8; sl = b * 2.2; sr = -b * 2.2; }
  if (pet.mode === 'carried') { const a = Math.sin(pet.phase); fl = 3 + a * 3; fr = 3 - a * 3; }
  setA(parts.footL, 'fl', 'transform', `translate(${sl.toFixed(1)} ${(-fl).toFixed(1)})`);
  setA(parts.footR, 'fr', 'transform', `translate(${sr.toFixed(1)} ${(-fr).toFixed(1)})`);
  const tp = tailParams();
  pet.tailPhase += dt * tp[1];
  if (parts.tail) setA(parts.tail, 'tail', 'transform', `rotate(${(Math.sin(pet.tailPhase) * tp[0]).toFixed(1)} ${parts.tailPivot})`);
  if (parts.earR) {
    if (pet.earT > 0) { pet.earT -= dt; setA(parts.earR, 'ear', 'transform', `rotate(${(Math.sin(pet.earT * 40) * 9).toFixed(1)} ${parts.earPivot})`); }
    else setA(parts.earR, 'ear', 'transform', `rotate(0 ${parts.earPivot})`);
  }
  if (parts.wingL) {
    const flying = pet.hover > 2 || air > 6;
    const amp = flying ? 22 : moving ? 10 : 5, spd = flying ? 20 : moving ? 10 : 2.6;
    pet.wingPhase += dt * spd;
    const a = (Math.sin(pet.wingPhase) * amp).toFixed(1);
    setA(parts.wingL, 'wl', 'transform', `rotate(${a} ${parts.wingPivot})`);
    setA(parts.wingR, 'wr', 'transform', `rotate(${a} ${parts.wingPivot})`);
  }
  if (parts.leg) {
    // a Legendary's wings beat pair after pair, deeper in flight; its lights circle
    const flying = pet.hover > 2 || air - lev > 6, amp = flying ? 24 : moving ? 14 : parts.levit ? 11 : 8, spd = flying ? 17 : moving ? 9 : parts.levit ? 4 : 3.2;
    pet.legPh = (pet.legPh || 0) + dt * spd;
    legMove(parts.leg, t, pet.legPh, amp);
  }
  if (parts.armL) {
    // arms swing while walking, wave when happy, droop when sleeping
    const f2 = currentFace();
    let al = 0, ar = 0;
    if (pet.mode === 'sleep') { al = ar = 8; }
    else if (moving) { const a2 = Math.sin(pet.phase * 2) * 26; al = a2; ar = -a2; }   // (arms swing with the steps)
    else if (f2.eyes === 'happy' || pet.mode === 'petted' || pet.mode === 'carried') { const a2 = -26 + Math.sin(t * 14) * 12; al = a2; ar = a2; }
    else { al = ar = Math.sin(t * 2) * 3; }
    setA(parts.armL, 'al', 'transform', `rotate(${al.toFixed(1)} ${parts.armPivot})`);
    setA(parts.armR, 'ar', 'transform', `rotate(${ar.toFixed(1)} ${parts.armPivot})`);
  }
  if (parts.orbs) {
    const [ox, oy, orr] = parts.orbit;
    parts.orbEls.forEach((el, i, all) => { const a = t * 1.2 + i * Math.PI * 2 / all.length; el.setAttribute('transform', `translate(${(ox + Math.cos(a) * orr).toFixed(1)} ${(oy + Math.sin(a) * orr * 0.5).toFixed(1)})`); });
  }
  setA(parts.face, 'face', 'transform', `translate(${(pet.look.x * 4).toFixed(1)} ${(pet.look.y * 3).toFixed(1)})`);
  const ey = parts.eyeY;
  setA(parts.blink, 'blink', 'transform', t < pet.blinkEnd ? `translate(0 ${ey}) scale(1 0.1) translate(0 ${-ey})` : 'translate(0 0)');
  const f = currentFace();
  setA(parts.svg, 'eyes', 'data-eyes', f.eyes);
  setA(parts.svg, 'mouth', 'data-mouth', f.mouth);
  setA(parts.svg, 'brows', 'data-brows', f.brows || 'none');
  setA(parts.svg, 'cheeks', 'data-cheeks', f.cheeks || 'normal');
  setA(parts.dirt, 'dirt', 'opacity', dirtLevel().toFixed(2));
  petEl.classList.toggle('glow', st.stage >= 6 && (st.lightsOff || isNight()));
}

/* speech bubble */
let bubbleTimer = 0;
function bubble(kind, dur) {
  const map = { food: ICON.bowl, moon: ICON.moon, ball: ICON.ball, hand: ICON.hand, bath: ICON.drop, full: 'Full!', dots: '…', bang: '!', angry: 'Hmph!', achoo: 'Achoo!', ouch: 'Ouch!', what: '?', yay: 'Yay!', found: 'Found me!', ha: 'Ha ha!' };
  const v = map[kind] || kind;
  if (!parts.bubble) return;
  if (v.charAt(0) === '<') parts.bubble.innerHTML = v; else parts.bubble.textContent = v;
  parts.bubble.hidden = false;
  parts.bubble.classList.remove('pop'); void parts.bubble.offsetWidth; parts.bubble.classList.add('pop');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(hideBubble, dur * 1000);
}
function hideBubble() { if (parts.bubble) parts.bubble.hidden = true; }

/* a Legendary's wings and lights, moving: for the pet you play with and the others in the room. They are layers of
   their own (petRigHTML), moved by CSS transforms only, so nothing is painted again as they move */
function legParts(root) {
  const W = $('.leg-wings', root), LL = $('.leg-lights', root);
  if (!W && !LL) return null;
  const L = { wps: W ? $$('.leg-wp', W).map(el => ({ el, side: +el.getAttribute('data-side') || 1, lag: +el.getAttribute('data-lag') || 0, k: +(el.getAttribute('data-k') || 1), th: 180 + (+el.getAttribute('data-mid') || 0), last: '' })) : [],
    flap: W ? W.getAttribute('data-flap').split(' ').map(Number) : [0, 0], beat: W && W.getAttribute('data-beat') ? W.getAttribute('data-beat').split(' ').map(Number) : [1, 1, 1] };
  if (LL) { L.at = LL.getAttribute('data-orbit').split(' ').map(Number); L.ls = $$('.leg-light', LL).map(el => ({ el, ring: +el.getAttribute('data-ring') || 0, fr: null })); }
  return L;
}
// a beat: on the upstroke the wings rise and close (their feathers or fingers drawn closer together across the
// wing, a little shorter), on the downstroke they sweep down and open wide. Each pair beats a moment after the main
// one. Closing only ever narrows a wing about its own middle, so no pair swings into another; the rise and fall is
// held within the room the fan leaves (flap). (The right wings are the left ones mirrored: turned the other way.)
function legMove(L, t, ph, amp) {
  // (each kind its own beat: a butterfly slow, deep and closing up; a dragonfly a quick shallow buzz)
  const B = L.beat || [1, 1, 1], up = L.flap[0], down = L.flap[1], fold = Math.min(0.62, amp / 50 * B[2]); amp *= B[1]; ph *= B[0];
  for (const w of L.wps) {
    const q = Math.sin(ph - w.lag), a = clamp(q * amp, -down, up) * w.k, kk = (0.5 + 0.5 * q) * w.k, sp = (1 - fold * kk).toFixed(3), su = (1 - fold * 0.25 * kk).toFixed(3);
    const A = (a * w.side).toFixed(1), th = w.th * w.side, tr = `rotate(${A}deg) rotate(${th}deg) scale(${su}, ${sp}) rotate(${-th}deg)`;
    if (tr !== w.last) { w.last = tr; w.el.style.transform = tr; }
  }
  if (L.ls) L.ls.forEach((o, i) => {
    // the lights round their tilted rings: each behind the pet on the far side, in front of it on the near side
    const [x, y, d, fr] = legLightAt(legLightPhase(i, t), L.at[0], L.at[1], o.ring);
    o.el.style.transform = `translate(${(x / 0.64).toFixed(1)}%, ${(y / 0.64).toFixed(1)}%) rotate(${Math.round(d)}deg)${o.ring ? ' scale(.78)' : ''}`;
    if (o.fr !== fr) { o.fr = fr; o.el.style.zIndex = fr ? '3' : '1'; }
  });

}
// how high a Celestial Legendary floats: well clear of the floor, drifting gently up and down (lower asleep, and on
// the ground when it is held or sits on something)
function levitate(t, asleep, held) { return held ? 0 : ps * (asleep ? 0.1 : 0.19) + Math.sin(t * 1.7) * ps * 0.03; }
