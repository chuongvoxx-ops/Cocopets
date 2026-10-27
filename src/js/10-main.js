/* ---------- touch on the room ---------- */
const ptr = { id: null, kind: null, x: 0, y: 0, sx: 0, sy: 0, lx: 0, ly: 0, t0: 0, moved: 0, samples: [], lp: 0, item: null };
const local = e => ({ x: e.clientX - stageRect.left, y: e.clientY - stageRect.top });
function hitPet(x, y, k) {
  k = k || 1;
  const s = pet.scale, cx = pet.x, cy = pet.y - pet.lift - (pet.lev || 0) - pet.perch - pb * s * 0.37;
  const rx = Math.max(30, pb * s * 0.33) * k, ry = Math.max(32, pb * s * 0.37) * k;
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
const hitBall = (x, y) => hyp(x - ball.x, y - (ball.y - ball.r - ball.z)) <= Math.max(30, ball.r * 1.8);
const inWindow = (x, y) => x > win.x - win.w / 2 && x < win.x + win.w / 2 && y > win.y - win.h && y < win.y;
function onDown(e) {
  sfx.unlock();
  if (!running || ptr.id !== null) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const sw = e.target && e.target.closest ? e.target.closest('[data-sw]') : null;
  if (sw) { e.preventDefault(); switchPet(+sw.dataset.sw); return; }
  if (decorating) { selectDecor(null); return; }
  const p = local(e);
  Object.assign(ptr, { id: e.pointerId, kind: 'floor', x: p.x, y: p.y, sx: p.x, sy: p.y, lx: p.x, ly: p.y, t0: now(), moved: 0, samples: [{ x: p.x, y: p.y, t: performance.now() }], item: null });
  try { stageEl.setPointerCapture(e.pointerId); } catch (_) {}
  pet.idleFor = 0;
  if (!trayEl.hidden) closeTray();
  if (act && act.onDown && act.onDown(p.x, p.y, e)) { ptr.kind = 'act'; return; }
  if (act && act.ownsPet) { ptr.kind = 'none'; return; }
  if (ball && !ball.held && hitBall(p.x, p.y)) { ptr.kind = 'ball'; grabBall(); return; }
  if (hitPet(p.x, p.y)) {
    ptr.kind = 'pet';
    clearTimeout(ptr.lp);
    ptr.lp = setTimeout(() => {
      if (ptr.kind === 'pet' && ptr.moved < 12 && !st.asleep && ['idle', 'move', 'petted', 'react', 'spin', 'use'].includes(pet.mode)) { ptr.kind = 'carry'; startCarry(); }
    }, 430);
    return;
  }
  const cp = hitComp(p.x, p.y);
  if (cp) { ptr.kind = 'comp'; ptr.comp = cp; return; }
  const bf = bflies.length ? butterflyAt(p.x, p.y) : null;
  if (bf) { ptr.kind = 'bfly'; ptr.bfly = bf; return; }
  const pl = plots.length ? plotAt(p.x, p.y) : null;
  if (pl) { ptr.kind = 'plot'; ptr.plot = pl; return; }
  const d = decorAt(p.x, p.y);
  if (d && (d.def.act || d.def.place === 'wall')) { ptr.kind = 'item'; ptr.item = d; return; }
  if (!isOutdoor() && inWindow(p.x, p.y)) { ptr.kind = 'window'; return; }
  floorTap(p.x, p.y);
}
function floorTap(x, y) {
  if (st.asleep || pet.mode === 'sleep') { tapMark(x, y); stir(1); return; }
  if (st.lightsOff || !canCommand()) { tapMark(x, y); return; }
  const p = clampXY(x, y);
  tapMark(x, y, p[0], p[1]);
  setGoal('tap', p[0], p[1], hyp(p[0] - pet.x, p[1] - pet.y) > W * 0.42);
  doneTip('tap');
}
function useItemTap(d, x, y) {
  doneTip('item');
  d.el.classList.remove('wiggle'); void d.el.offsetWidth; d.el.classList.add('wiggle');
  if (d.def.act === 'lamp') { setLights(!st.lightsOff); return; }
  if (d.def.place === 'wall') {
    if (d.it.id === 'clock') toast(`It's ${new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`);
    else floatText(d.it.id === 'frame_pet' ? 'Aww' : '♪', x, y);
    return;
  }
  if (d.def.act === 'bowl') { openTray('feed'); return; }
  if (st.asleep || pet.mode === 'sleep') { stir(1); return; }
  if (!canCommand() || st.lightsOff) return;
  tapMark(x, y);
  goUse(d);
}
function windowTap() {
  if (!canCommand() || st.lightsOff) return;
  setGoal('window', clamp(win.x, B.x0, B.x1), B.y0, false);
}
function lookOutside() {
  setMode('idle'); pet.think = rand(3, 5);
  pet.lookGoal = { x: 0, y: -1 }; pet.lookUntil = now() + 2.5;
  bubble(sunOn ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#FFD447" stroke="#2B2433" stroke-width="2"/></svg>' : ICON.moon, 2);
  st.joy = Math.min(100, st.joy + 1);
  spawnFx('note', pet.x, headY());
}
function onMove(e) {
  if (ptr.id === null) {
    if (e.pointerType === 'mouse') { const p = local(e); hover.on = true; hover.x = p.x; hover.y = p.y; }
    return;
  }
  if (e.pointerId !== ptr.id) return;
  const p = local(e), d = hyp(p.x - ptr.lx, p.y - ptr.ly);
  ptr.moved += d; ptr.lx = ptr.x = p.x; ptr.ly = ptr.y = p.y;
  const t = performance.now();
  ptr.samples.push({ x: p.x, y: p.y, t });
  while (ptr.samples.length > 2 && t - ptr.samples[0].t > 110) ptr.samples.shift();
  switch (ptr.kind) {
    case 'act': if (act && act.onMove) act.onMove(p.x, p.y); break;
    case 'ball':
      if (ball) { const b = ballBounds(); ball.x = clamp(p.x, b.x0, b.x1); ball.y = clamp(p.y + ball.r + ball.z, b.y0, b.y1); }
      break;
    case 'pet':
      if (ptr.moved > 10) {
        clearTimeout(ptr.lp);
        if (hitPet(p.x, p.y, 1.3)) rub(d);
        else { ptr.kind = 'follow'; if (canCommand() && !st.lightsOff) setGoal('follow', p.x, p.y, true); }
      }
      break;
    case 'floor': case 'item': case 'window': case 'comp': case 'plot': case 'bfly':
      if (hyp(p.x - ptr.sx, p.y - ptr.sy) > 16 && canCommand() && !st.lightsOff) { ptr.kind = 'follow'; clearMarker(false); setGoal('follow', p.x, p.y, true); }
      break;
    case 'follow':
      if ((!pet.goal || pet.goal.kind !== 'follow') && canCommand() && !st.lightsOff) setGoal('follow', p.x, p.y, true);
      if (Math.random() < 0.07) spawnFx('sparkle', p.x, p.y, { dx: rand(-10, 10), dy: rand(-24, -12) });
      break;
  }
}
function onUp(e, cancelled) {
  if (e.pointerId !== ptr.id) return;
  clearTimeout(ptr.lp);
  const dur = now() - ptr.t0;
  switch (ptr.kind) {
    case 'act': if (act && act.onUp) act.onUp(ptr.x, ptr.y); break;
    case 'ball': if (ball) { if (!cancelled && ptr.moved < 8 && dur < 0.3) tossBall(); else releaseBall(); } break;
    case 'pet': if (!cancelled && ptr.moved < 10 && dur < 0.42) boop(); break;
    case 'carry': dropPet(); break;
    case 'item': if (!cancelled && ptr.moved < 12) useItemTap(ptr.item, ptr.sx, ptr.sy); break;
    case 'window': if (!cancelled && ptr.moved < 12) windowTap(); break;
    case 'comp': if (!cancelled && ptr.moved < 12) tapComp(ptr.comp); break;
    case 'plot': if (!cancelled && ptr.moved < 12) tapPlot(ptr.plot); break;
    case 'bfly': if (!cancelled && ptr.moved < 12) tapButterfly(ptr.bfly); break;
    case 'follow':
      if (pet.goal && pet.goal.kind === 'follow') {
        const p = clampXY(ptr.x, ptr.y);
        pet.goal.kind = 'tap'; pet.goal.x = p[0]; pet.goal.y = p[1]; pet.goal.run = false;
      }
      break;
  }
  ptr.id = null; ptr.kind = null;
}
stageEl.addEventListener('pointerdown', onDown);
stageEl.addEventListener('pointermove', onMove);
stageEl.addEventListener('pointerup', e => onUp(e, false));
stageEl.addEventListener('pointercancel', e => onUp(e, true));
stageEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover.on = false; });
stageEl.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#giftWrap').hidden) return;
  if (mapOpen && !arc.open) { if (!sheetWrap.hidden) closeSheet(); else if (!mapCard.hidden) closeStageCard(); else closeMap(); return; }
  if (mansionOpen) { if (!sheetWrap.hidden) closeSheet(); else closeMansion(); return; }
  if (!$('#resultWrap').hidden) $('#resultWrap').hidden = true;
  else if (!sheetWrap.hidden) closeSheet();
  else if (!$('#widgetOvl').hidden) { $('#widgetOvl').hidden = true; widgetOpen = false; }
  else if (!$('#labOvl').hidden) $('#labOvl').hidden = true;
  else if (!trayEl.hidden) closeTray();
  else if (decorating) exitDecor();
  else if (homeMode) setHomeMode(false);
  else if (act) endActivity(true);
});

/* ---------- game lifecycle ---------- */
let lastStatAt = Date.now(), fastAcc = 0;
function applyStateToScene() {
  cozyCache = -1;
  buildPet(true);
  renderDecor(); renderPlots(); resetButterflies(); buildCompanions();
  pet.stageS = petScaleTarget();
  document.body.classList.toggle('lights-off', st.lightsOff);
  if (st.asleep && pet.mode !== 'sleep') {
    const bed = bestBed();
    if (bed) { const sp = useSpot(bed); pet.x = sp.x; pet.y = clamp(sp.y, B.y0, B.y1); pet.perch = sp.perch; pet.perchZ = sp.z; }
    pet.goal = null; setMode('sleep'); pet.zT = 0.5;
  } else if (!st.asleep && pet.mode === 'sleep') { unperch(); setMode('idle'); }
  syncDock(); updateHud(); updateHint();
}
function startGame(fresh) {
  running = true;
  introEl.hidden = true; splashEl.hidden = true;
  appEl.classList.add('playing');
  layout();
  const p = clampXY(W * 0.5, B.y0 + (B.y1 - B.y0) * 0.55);
  pet.x = p[0]; pet.y = p[1]; pet.facing = 1; pet.goal = null; pet.perch = 0; pet.perchZ = 0; pet.lift = 0; pet.zOver = 0;
  setMode('idle');
  applyStateToScene();
  layout();
  lastStatAt = Date.now();
  dailyGift();
  if (fresh) {
    setTimeout(() => { if (running) { jump(ps * 0.22); hearts(3); sfx.yum(); } }, 300);
    toast(`Say hi to ${st.name}!`);
    saveLocalNow(); Store.touch();
  } else if (awayMs > 3 * 36e5 && !st.asleep) setTimeout(() => { if (running && canCommand()) greet(); }, 500);
}
function adoptState(s) {
  loadedSavedAt = s.savedAt;
  awayMs = catchUp(s, Date.now());
  st = s; cozyCache = -1;
  if (running) applyStateToScene(); else startGame(false);
}
function clearWorld() {
  if (act) endActivity(true);
  comps.forEach(c => c.el.remove()); comps = [];
  plots.forEach(p => p.el.remove()); plots = [];
  bflies.forEach(b => b.el.remove()); bflies = [];
  foods.slice().forEach(removeFood);
  if (ball) { ball.el.remove(); ball.sh.remove(); ball = null; }
  clearMarker(false); hideBubble(); fxEl.innerHTML = ''; fxCount = 0;
  if (homeMode) setHomeMode(false);
  if (decorating) exitDecor();
  document.body.classList.remove('lights-off');
  closeTray();
}
async function doReset() {
  running = false; clearWorld();
  decor.forEach(d => d.el.remove()); decor = [];
  await Store.remove();
  st = null; hatchedThisSession = false; petKey = '';
  showIntro();
}
function tickStats() {
  const t = Date.now(), el = t - lastStatAt;
  lastStatAt = t;
  if (el <= 0) return;
  if (el > 120e3) {
    st.savedAt = t - el;
    const away = catchUp(st, t);
    if (away > 30 * 60e3) applyStateToScene();
    return;
  }
  const h = (el / 36e5) * (st.fast ? FAST : 1);
  applyHours(st, h, st.asleep);
  const night = isNight();
  for (const o of st.others) {
    applyHours(o, h * OTHER_RATE, o.asleep || st.lightsOff);
    if (!o.asleep && (o.energy < 12 || (night && o.energy < 85))) o.asleep = true;
    else if (o.asleep && !night && o.energy >= 96) o.asleep = false;
  }
  growFarm(st, h);
  if (st.fast) { fastAcc += h; if (fastAcc > 6) { fastAcc = 0; Store.touch(); } }
}
let lastFrame = performance.now(), hudT = 0, secT = 0, saveT = 5, skyT = 60, levelSeen = 0;
let roomOff = false, arcOn = false;
function frame(ms) {
  requestAnimationFrame(frame);
  let dt = (ms - lastFrame) / 1000;
  lastFrame = ms;
  if (!(dt > 0)) return;
  if (dt > 0.05) dt = 0.05;
  if (!running || !st) return;
  tickStats();
  const off = !!(arc.open || mapOpen || mansionOpen); if (off !== roomOff) { roomOff = off; document.body.classList.toggle('room-off', off); }
  if (!!arc.open !== arcOn) { arcOn = !!arc.open; document.body.classList.toggle('arc-on', arcOn); }
  if (arc.open || mapOpen || mansionOpen) { hudT -= dt; if (hudT <= 0) { hudT = 1; if (mapOpen && !arc.open) $('#mapEnergy b').textContent = Math.round(st.energy) + '%'; } saveT -= dt; if (saveT <= 0) { saveT = 5; saveLocalNow(); } return; }
  pet.kickCd = Math.max(0, pet.kickCd - dt);
  pet.idleFor += dt; pet.modeT += dt;
  physics(dt);
  switch (pet.mode) {
    case 'idle': updateIdle(dt); break;
    case 'move': updateMove(dt); break;
    case 'eat': updateEat(dt); break;
    case 'sleep': updateSleep(dt); break;
    case 'carried': updateCarried(dt); break;
    case 'petted': updatePetted(dt); break;
    case 'react': updateReact(dt); break;
    case 'spin': updateSpin(dt); break;
    case 'use': updateUse(dt); break;
    case 'dig': updateDig(dt); break;
    case 'trick': updateTrick(dt); break;
    case 'catch': case 'bathe': case 'hidden': break;
    default: setMode('idle');
  }
  if (pet.mode === 'move' && pet.goal && ball && wantsBall() &&
      (pet.goal.kind === 'wander' || pet.goal.kind === 'sun' || pet.goal.kind === 'use' || (pet.goal.kind === 'tap' && ball.touchedAt > pet.goal.t))) chaseBall();
  updateActivity(dt);
  updateBall(dt);
  updateLook(dt); updateBlink();
  renderPet(dt); renderBall();
  updateCompanions(dt); updateButterflies(dt);
  hudT -= dt; if (hudT <= 0) { hudT = 0.3; updateHud(); }
  secT -= dt;
  if (secT <= 0) {
    secT = 1;
    const lv = bondInfo(st.xp).level;
    if (levelSeen && lv > levelSeen && !act) { sparkles(8); }
    levelSeen = lv;
    if (plots.length) refreshPlots();
  }
  saveT -= dt; if (saveT <= 0) { saveT = 5; saveLocalNow(); }
  skyT -= dt; if (skyT <= 0) { skyT = 30; updateSky(); updateClocks(); dailyGift(); }
}
function updateActivity(dt) { if (act && act.update) act.update(dt); }

/* ---------- boot: hot-reload snapshot, then this browser, then your account ---------- */
let splashTimer = 0;
function onRemote(res) {
  if (!res) return;
  const r = res.remote ? sanitize(res.remote) : null;
  if (!st) {
    if (r) {
      clearTimeout(splashTimer); splashEl.hidden = true;
      introEl.hidden = true;
      adoptState(r);
    } else if (!splashEl.hidden) { clearTimeout(splashTimer); splashEl.hidden = true; showIntro(); }
    return;
  }
  if (!r) { Store.touch(); return; }
  if (r.hid !== st.hid) {
    if (hatchedThisSession || r.savedAt > loadedSavedAt) { hatchedThisSession = false; adoptState(r); toast(`${r.name} is back`); }
    else Store.touch();
    return;
  }
  if (r.savedAt > loadedSavedAt + 1500) adoptState(r);
  else Store.touch();
}
function boot(hot) {
  Store.init();
  layout();
  updateSky();
  const fromHot = hot && hot.pet ? sanitize(hot.pet) : null;
  const local = sanitize(Store.readLocal());
  let s = fromHot || local;
  if (fromHot && local && local.hatchedAt === fromHot.hatchedAt && local.savedAt > fromHot.savedAt) s = local;
  if (s) adoptState(s);
  else {
    splashEl.hidden = false;
    splashTimer = setTimeout(() => { if (!st) { splashEl.hidden = true; showIntro(); } }, 1500);
  }
  Store.connect().then(onRemote);
}
function flushAll() { if (st && running) { saveLocalNow(); Store.flush(); } }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushAll();
  else lastFrame = performance.now();
});
window.addEventListener('pagehide', flushAll);
window.addEventListener('resize', () => requestAnimationFrame(layout));
try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layout()); } catch (e) {}

requestAnimationFrame(frame);
const hotHook = window.claude && window.claude.hot;
let booted = false;
const go = data => { if (booted) return; booted = true; boot(data || {}); };
try { if (hotHook && typeof hotHook.snapshot === 'function') hotHook.snapshot(() => (st ? { pet: serialize() } : {})); } catch (e) {}
try {
  if (hotHook && typeof hotHook.ready === 'function') { hotHook.ready(go); setTimeout(() => go({}), 2000); }
  else go((hotHook && hotHook.data) || {});
} catch (e) { go({}); }
