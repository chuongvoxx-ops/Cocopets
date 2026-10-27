/* ---------- the farm: plant seeds, water them, harvest growth food ---------- */
let plots = [];
const PLOT_POS = [[0.06, 0.1], [0.5, 0.1], [0.94, 0.1], [0.06, 0.86], [0.5, 0.86], [0.94, 0.86]];
const PIO = 'stroke="#2B2433" stroke-width="2.4" stroke-linejoin="round"';
function renderPlots() {
  plots.forEach(p => p.el.remove()); plots = [];
  if (!st || !st.room || !st.room.plots) return;
  st.room.plots.forEach((q, i) => {
    const el = document.createElement('div'); el.className = 'plot';
    worldEl.appendChild(el);
    plots.push({ i, q, el, x: 0, y: 0, w: 0, h: 0, key: '' });
  });
  positionPlots(); refreshPlots();
}
function positionPlots() {
  for (const p of plots) {
    const [fx, fy] = PLOT_POS[p.i];
    const w = clamp(Math.min(ps * 0.9, (F.x1 - F.x0) * 0.25), 60, 140), h = w * 90 / 120;
    const x = F.x0 + w * 0.5 + fx * (F.x1 - F.x0 - w), y = F.y0 + h * 0.92 + fy * Math.max(8, F.y1 - F.y0 - h * 1.05);
    p.x = x; p.y = y; p.w = w; p.h = h;
    p.el.style.width = w.toFixed(1) + 'px'; p.el.style.height = h.toFixed(1) + 'px';
    p.el.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px, ${(y - h).toFixed(1)}px, 0)`;
    p.el.style.zIndex = String(Math.round(y) - 8);
  }
}
function cropStage(q) {
  if (!q.crop) return -1;
  const need = CROPS[q.crop].hours;
  return q.g >= need ? 3 : Math.min(2, Math.floor(q.g / need * 3));
}
function refreshPlots() {
  for (const p of plots) {
    const q = p.q, sg = cropStage(q), key = `${q.crop}|${sg}|${q.water}`;
    if (key === p.key) continue;
    p.key = key;
    p.el.innerHTML = plotSVG(q, sg);
    p.el.classList.toggle('ready', sg === 3);
  }
}
function sproutSVG(x, h, leaves) {
  let s = `<path d="M${x} 52V${52 - h}" stroke="#4FA35E" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i < leaves; i++) { const y = 52 - h + 4 + i * 6, d = i % 2 ? 1 : -1; s += `<path d="M${x} ${y}q${d * 9} -4 ${d * 11} -10q${-d * 9} 0 ${-d * 11} 10z" fill="#6CC15A" ${PIO}/>`; }
  return s;
}
function readySVG(crop) {
  switch (crop) {
    case 'sunberry': return [30, 60, 90].map(x => `<circle cx="${x}" cy="38" r="15" fill="#4FA35E" ${PIO}/>` + [[-6, -4], [5, -7], [0, 5], [8, 4], [-8, 6]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${38 + dy}" r="3.6" fill="#FFAA3D" stroke="#2B2433" stroke-width="1.3"/>`).join('')).join('');
    case 'carrot': return [30, 60, 90].map(x => `<path d="M${x} 46Q${x - 10} 24 ${x - 12} 20M${x} 46Q${x} 20 ${x + 2} 16M${x} 46Q${x + 10} 24 ${x + 13} 21" fill="none" stroke="#4FA35E" stroke-width="4" stroke-linecap="round"/><path d="M${x - 7} 55L${x} 41L${x + 7} 55Z" fill="#FF9F43" ${PIO}/>`).join('');
    case 'pumpkin': return `<path d="M20 52Q30 36 44 44M100 52Q90 36 76 44" fill="none" stroke="#4FA35E" stroke-width="3.5" stroke-linecap="round"/><path d="M22 42q-8-8-2-14q6 4 2 14zM98 42q8-8 2-14q-6 4-2 14z" fill="#6CC15A" ${PIO}/><path d="M60 26Q60 18 66 15" fill="none" stroke="#4FA35E" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="60" cy="44" rx="24" ry="17" fill="#FF9F43" ${PIO}/><path d="M50 29Q44 44 50 60M70 29Q76 44 70 60M60 27V61" fill="none" stroke="#D9772E" stroke-width="2"/>`;
    default: return `<path d="M58 56V24H62V56Z" fill="#9C7149" ${PIO}/><circle cx="60" cy="20" r="19" fill="#58B068" ${PIO}/>` + [[47, 18], [66, 9], [72, 28], [52, 31]].map(([x, y]) => `<path d="${starPath(x, y, 6)}" fill="#FFE37A" stroke="#2B2433" stroke-width="1.4" stroke-linejoin="round"/>`).join('');
  }
}
function plotSVG(q, sg) {
  const wet = q.water && sg < 3;
  let s = `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M8 56L19 44H101L112 56Z" fill="${wet ? '#5E4027' : '#7E5A3A'}" ${PIO}/><path d="M30 50h16M56 50h14M82 50h12" stroke="${wet ? '#46301D' : '#664629'}" stroke-width="2.6" stroke-linecap="round"/><path d="M8 56H112V80Q112 87 105 87H15Q8 87 8 80Z" fill="#C48A52" ${PIO}/><path d="M8 70H112M42 56V87M78 56V87" stroke="#9C6B3E" stroke-width="2"/>`;
  if (sg === 0) s += [30, 60, 90].map(x => sproutSVG(x, 7, 1)).join('');
  else if (sg === 1) s += [30, 60, 90].map(x => sproutSVG(x, 15, 2)).join('');
  else if (sg === 2) s += [30, 60, 90].map(x => sproutSVG(x, 24, 4)).join('') + [30, 60, 90].map(x => `<circle cx="${x}" cy="36" r="3.4" fill="#FFF3B0" stroke="#2B2433" stroke-width="1.3"/>`).join('');
  else if (sg === 3) s += readySVG(q.crop) + `<g class="twinkle" fill="#FFFFFF" stroke="#2B2433" stroke-width="1.2"><path d="${starPath(14, 22, 6)}"/><path d="${starPath(108, 30, 5)}"/></g>`;
  if (sg >= 0 && sg < 3 && !q.water) s += `<g transform="translate(108 12)"><circle r="11" fill="#FFFDF8" stroke="#2B2433" stroke-width="2.2"/><path d="M0 -6.5s5.2 5.6 5.2 8.6a5.2 5.2 0 0 1-10.4 0c0-3 5.2-8.6 5.2-8.6z" fill="#6FCBE3" stroke="#2B2433" stroke-width="1.5"/></g>`;
  if (sg < 0) s += `<g transform="translate(60 32)" opacity=".85"><circle r="12" fill="#FFFDF8" stroke="#2B2433" stroke-width="2.2"/><path d="M0 -6V6M-6 0H6" stroke="#2B2433" stroke-width="2.6" stroke-linecap="round"/></g>`;
  return s + '</svg>';
}
const plotAt = (x, y) => plots.find(p => x > p.x - p.w * 0.48 && x < p.x + p.w * 0.48 && y > p.y - p.h * 0.75 && y < p.y + 4);
function walkToPlot(p) {
  if (!canCommand() || st.lightsOff) return;
  const side = pet.x < p.x ? -1 : 1, q = clampXY(p.x + side * p.w * 0.5, p.y + 2);
  setGoal('tap', q[0], q[1], false);
}
function tapPlot(p) {
  const q = p.q, sg = cropStage(q);
  p.el.classList.remove('wiggle'); void p.el.offsetWidth; p.el.classList.add('wiggle');
  if (sg < 0) { openSeedTray(p.i); return; }
  walkToPlot(p);
  if (sg === 3) { harvest(p); return; }
  const c = CROPS[q.crop], left = (c.hours - q.g) / (q.water ? 2 : 1);
  if (!q.water) {
    q.water = true; p.key = ''; refreshPlots();
    for (let i = 0; i < 6; i++) spawnFx('drop', p.x + rand(-0.35, 0.35) * p.w, p.y - p.h * 0.7, { dx: 0, dy: 0 });
    sfx.splash();
    toast(`Watered! ${c.name} grow twice as fast now: ready in ${fmtWait(left / 2)}.`, 3200);
    saveSoon();
    return;
  }
  toast(`${c.name} ready in ${fmtWait(left)}`);
}
function harvest(p) {
  const q = p.q, c = CROPS[q.crop], k = q.crop;
  st.pantry[k] = (st.pantry[k] || 0) + c.yield;
  floatText(`+${c.yield}`, p.x, p.y - p.h, SNACK_SVG[k]);
  for (let i = 0; i < 6; i++) spawnFx('sparkle', p.x + rand(-0.4, 0.4) * p.w, p.y - rand(0.3, 0.8) * p.h, { dx: rand(-20, 20), dy: rand(-40, -10) });
  sfx.sparkle(); addXP(3);
  q.crop = null; q.g = 0; q.water = false; p.key = '';
  refreshPlots();
  if (!st.tips.harvest) { st.tips.harvest = true; toast(`${c.name} went to the pantry. Feed them from the Feed menu for extra growth.`, 3800); }
  saveSoon();
}
let seedPlot = -1;
function openSeedTray(i) {
  seedPlot = i;
  if (trayKind) closeTray();
  trayKind = 'seeds';
  trayInner.innerHTML = `<div class="tray-head"><h2>Plant a seed</h2><p>Crops grow in real time, even while the app is closed. Water them to grow twice as fast.</p><button class="icon-btn" type="button" data-close aria-label="Close">${ICON.close}</button></div><div class="tiles four">` +
    Object.keys(CROPS).map(k => { const c = CROPS[k], sn = SNACKS[k]; return `<button class="tile seed${st.coins < c.seed ? ' cant' : ''}" type="button" data-seed="${k}">${SNACK_SVG[k]}<b>${c.name}</b><small>${ICON.coin}${c.seed} · ${fmtWait(c.hours)}</small><small>+${sn.xp} bond</small></button>`; }).join('') + '</div>';
  trayEl.hidden = false; syncDock(); updateHint();
}
function plantSeed(k) {
  const c = CROPS[k], p = plots.find(q => q.i === seedPlot);
  if (!c || !p || p.q.crop) { closeTray(); return; }
  if (st.coins < c.seed) { toast(`${c.name} seeds cost ${c.seed} coins. Games and adventures earn coins.`); sfx.wrong(); return; }
  st.coins -= c.seed; updateHud();
  p.q.crop = k; p.q.g = 0; p.q.water = false; p.key = '';
  closeTray(); refreshPlots(); walkToPlot(p);
  for (let i = 0; i < 4; i++) spawnFx('dirt', p.x + rand(-0.3, 0.3) * p.w, p.y - p.h * 0.35, { dx: rand(-40, 40) });
  sfx.dig(); doneTip('farm');
  toast(`${c.name} planted. Tap the plot to water it.`);
  saveSoon();
}
trayInner.addEventListener('click', e => { const b = e.target.closest('[data-seed]'); if (b) plantSeed(b.dataset.seed); });
