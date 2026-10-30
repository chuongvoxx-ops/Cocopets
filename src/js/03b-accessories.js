/* ---------- Accessories: a pet wears three, a ring, a bracelet and a necklace, and each makes it stronger in the Tower.
   They drop in the Tower (from monsters, treasure chests, bosses and floor clears), rarer the higher you climb, and the
   rarer the piece the bigger its bonus: a ring for power, a necklace for health, a bracelet for magic, and on the rarer
   pieces extra bonuses (crits, defence, speed, haste, coins, experience, treasure find). They are game modifiers only:
   nothing about the pet's look changes. ---------- */
const ACC_TYPES = ['ring', 'bracelet', 'necklace'];
const ACC_TYPE = {
  ring: { name: 'Ring', main: 'atk', pool: ['crit', 'critd', 'cdr', 'spd', 'gold', 'xp'], desc: 'Rings add power: every attack hits harder.' },
  bracelet: { name: 'Bracelet', main: 'mp', pool: ['regen', 'cdr', 'crit', 'spd', 'def', 'luck'], desc: 'Bracelets add MP and MP per hit: Strong attacks and Ults come round sooner.' },
  necklace: { name: 'Necklace', main: 'hp', pool: ['def', 'regen', 'luck', 'gold', 'xp', 'critd'], desc: 'Necklaces add health: the pet can take far more before it falls.' },
};
/* six rarities, from Common to Mythic: the rarer, the bigger the main bonus and the more extra bonuses */
const ACC_R = [
  { id: 'common', name: 'Common', c: '#A9B8CB', d: '#5A6A80', metal: ['#D9AE80', '#8A5A30'], aff: 0, k: 0, scrap: 15 },
  { id: 'uncommon', name: 'Uncommon', c: '#7FD87A', d: '#2F7A3A', metal: ['#E2BE7A', '#9A6E2E'], aff: 1, k: 0.35, scrap: 40 },
  { id: 'rare', name: 'Rare', c: '#5DA8F0', d: '#1F5BA8', metal: ['#F2F5FA', '#98A4B8'], aff: 1, k: 0.5, scrap: 100 },
  { id: 'epic', name: 'Epic', c: '#B983F5', d: '#5B2EA6', metal: ['#FFE48E', '#C38A22'], aff: 2, k: 0.7, scrap: 250 },
  { id: 'legend', name: 'Legendary', c: '#FFB43C', d: '#A2600A', metal: ['#FFF4CC', '#E2A032'], aff: 2, k: 0.85, scrap: 600 },
  { id: 'mythic', name: 'Mythic', c: '#FF6FD8', d: '#8A2A8A', metal: ['#FFFFFF', '#C2A6FF'], aff: 3, k: 1, scrap: 1500 },
];
/* the main bonus, by rarity: the lowest and highest a piece can roll (as a fraction: 1.5 is +150%) */
const ACC_MAIN = {
  atk: [[0.08, 0.15], [0.16, 0.3], [0.32, 0.55], [0.6, 0.95], [1.0, 1.45], [1.5, 2.0]],
  hp: [[0.12, 0.25], [0.28, 0.5], [0.55, 0.9], [0.95, 1.5], [1.6, 2.2], [2.3, 3.0]],
  mp: [[0.1, 0.2], [0.22, 0.4], [0.45, 0.7], [0.75, 1.1], [1.15, 1.6], [1.7, 2.4]],
};
/* the extra bonuses at their Mythic best; a rarer piece rolls closer to it */
const ACC_AFF = {
  crit: { name: 'crit chance', max: 0.15, epi: 'Precision' },
  critd: { name: 'crit damage', max: 0.6, epi: 'Ruin' },
  def: { name: 'damage taken', max: 0.2, epi: 'Warding', minus: true },
  spd: { name: 'speed', max: 0.15, epi: 'Swiftness' },
  cdr: { name: 'cooldowns', max: 0.18, epi: 'Haste', minus: true },
  regen: { name: 'MP per hit', max: 0.6, epi: 'Flow' },
  gold: { name: 'coins', max: 0.5, epi: 'Fortune' },
  xp: { name: 'experience', max: 0.5, epi: 'Wisdom' },
  luck: { name: 'treasure find', max: 0.5, epi: 'Luck' },
};
const ACC_MAIN_NAME = { atk: 'Power', hp: 'HP', mp: 'MP' };
const ACC_KEYS = ['atk', 'hp', 'mp', 'rg', 'crit', 'critd', 'def', 'spd', 'cdr', 'regen', 'gold', 'xp', 'luck'];
/* however many a pet wears, some bonuses stop somewhere */
const ACC_CAP = { crit: 0.35, def: 0.5, spd: 0.35, cdr: 0.4 };
const ACC_BAG = 150;
const ACC_MAT = [['Copper', 'Tin', 'Bone'], ['Bronze', 'Jade', 'Quartz'], ['Silver', 'Sapphire', 'Moonstone'], ['Gold', 'Amethyst', 'Opal'], ['Platinum', 'Sunstone', 'Dragonbone'], ['Starlight', 'Celestial', 'Aether']];
const accUid = () => 'a' + Math.random().toString(36).slice(2, 10);
const r3 = v => Math.round(v * 1000) / 1000;
/* how rare a piece found on floor n is: the higher the floor (and the bigger the foe), the rarer it runs.
   Legendary pieces begin to appear past floor 18 or so, Mythic ones past floor 54 */
function accRarityWeights(n, bonus) {
  const f = clamp(((n || 1) + (bonus || 0)) / 120, 0, 1.4);
  return [Math.max(2, 60 - 70 * f), Math.max(4, 28 - 8 * f), 8 + 25 * f, 1 + 26 * f, f > 0.15 ? (f - 0.15) * 22 : 0, f > 0.45 ? (f - 0.45) * 12 : 0];
}
function accRarityFor(n, bonus, R) {
  const w = accRarityWeights(n, bonus), tot = w.reduce((a, b) => a + b, 0); let x = (R || Math.random)() * tot;
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; }
  return 0;
}
/* a new piece: its type, rarity, main bonus and any extra bonuses. o: { t, r, min, bonus, R } */
function rollAccessory(n, o) {
  o = o || {}; const R = o.R || Math.random, t = ACC_TYPES.includes(o.t) ? o.t : ACC_TYPES[Math.floor(R() * 3)];
  const r = clamp(Math.max(o.min || 0, o.r != null ? o.r : accRarityFor(n, o.bonus, R)), 0, ACC_R.length - 1), T = ACC_TYPE[t], s = {};
  const [lo, hi] = ACC_MAIN[T.main][r], v = lo + (hi - lo) * R();
  s[T.main] = r3(v);
  if (t === 'bracelet') s.rg = r3(v * 0.5);   // a bracelet's magic comes with more MP per hit
  const pool = T.pool.slice();
  for (let i = 0; i < ACC_R[r].aff && pool.length; i++) { const k = pool.splice(Math.floor(R() * pool.length), 1)[0]; s[k] = r3(ACC_AFF[k].max * ACC_R[r].k * (0.7 + 0.3 * R())); }
  return { u: accUid(), t, r, s, f: Math.max(1, Math.floor(n || 1)), nm: Math.floor(R() * 1e6), nw: 1 };
}
function accName(a) {
  if (a.sp && ACC_SPECIAL[a.sp]) return ACC_SPECIAL[a.sp].name;
  const mat = ACC_MAT[a.r][a.nm % 3]; let best = null, bv = 0;
  for (const k in a.s) if (ACC_AFF[k]) { const v = a.s[k] / ACC_AFF[k].max; if (v > bv) { bv = v; best = k; } }
  return `${mat} ${ACC_TYPE[a.t].name}${best ? ' of ' + ACC_AFF[best].epi : ''}`;
}
const accPct = v => `${Math.round(v * 100)}%`;
/* every bonus a piece gives, in words: the main one first */
function accLines(a) {
  const T = ACC_TYPE[a.t], out = [`+${accPct(a.s[T.main] || 0)} ${ACC_MAIN_NAME[T.main]}`];
  if (a.s.rg) out.push(`+${accPct(a.s.rg)} MP per hit`);
  for (const k in a.s) if (ACC_AFF[k]) out.push(`${ACC_AFF[k].minus ? '−' : '+'}${accPct(a.s[k])} ${ACC_AFF[k].name}`);
  return out;
}
const accMainText = a => accLines(a)[0];
/* what a pet is wearing, and every bonus it adds up to */
function accItemsOf(p) {
  if (!p || !p.acc || !st || !Array.isArray(st.accs)) return [];
  return ACC_TYPES.map(t => p.acc[t] ? st.accs.find(a => a.u === p.acc[t] && a.t === t) : null).filter(Boolean);
}
function accStats(p) {
  const out = {};
  accItemsOf(p).forEach(a => { for (const k in a.s) { const kk = k === 'rg' ? 'regen' : k; out[kk] = (out[kk] || 0) + a.s[k]; } });
  for (const k in ACC_CAP) if (out[k] > ACC_CAP[k]) out[k] = ACC_CAP[k];
  return out;
}
/* who wears a piece, if anyone */
function accWearer(u) { if (!st) return null; return [st].concat(st.others || []).find(p => p.acc && ACC_TYPES.some(t => p.acc[t] === u)) || null; }
/* a short summary of a pet's accessory bonuses */
function accSummary(p) {
  const A = accStats(p), out = [];
  if (A.atk) out.push(`+${accPct(A.atk)} Power`); if (A.hp) out.push(`+${accPct(A.hp)} HP`); if (A.mp) out.push(`+${accPct(A.mp)} MP`); if (A.regen) out.push(`+${accPct(A.regen)} MP per hit`);
  ['crit', 'critd', 'def', 'spd', 'cdr', 'gold', 'xp', 'luck'].forEach(k => { if (A[k]) out.push(`${ACC_AFF[k].minus ? '−' : '+'}${accPct(A[k])} ${ACC_AFF[k].name}`); });
  return out;
}
/* the special pieces a rift's seal gives (their own name and look; the bonuses roll as for any piece of their kind) */
const ACC_SPECIAL = { orbit: { t: 'ring', name: 'Orbital Ring', what: 'A tiny sun and crescent orbit the same centre: the Balance Sigil of the Sea of Fallen Colours, made small enough for a Cocopet.' },
  veil: { t: 'necklace', name: 'Closed-Eye Talisman', what: 'A sealed eye of calcite on a black cord: the Veil Sigil of the Basilica of the Veiled Eye. Whatever it looks at, it chooses not to see.' },
  bell: { t: 'necklace', name: 'Rhythm Bell', what: 'A small bone bell with a tarnished gold rim on a maroon cord: the Rhythm Sigil of the Choir Before Creation. It gives a soft chime when its wearer dodges (mute it on the necklace or in Settings).' } };
/* the Rhythm Bell's cosmetic chime: when the pet you play wears it, a soft bell note (on a dodge); st.bellMute silences it */
function accBellChime(force) { if (!st || (st.bellMute && !force) || st.sound === false) return; const u = st.acc && st.acc.necklace, a = u && (st.accs || []).find(x => x.u === u); if (!force && (!a || a.sp !== 'bell')) return; const now = performance.now(); if (!force && now - (accBellChime.t || 0) < 350) return; accBellChime.t = now; try { sfx.chime(1568, 0.3); sfx.chime(2093, 0.12); } catch (e) {} }
/* ---- the save: the bag of pieces and which pet wears what ---- */
function cleanAccs(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter(a => a && typeof a === 'object' && typeof a.u === 'string' && /^a[a-z0-9]{4,12}$/.test(a.u) && ACC_TYPES.includes(a.t) && !seen.has(a.u) && seen.add(a.u)).slice(0, ACC_BAG).map(a => {
    const s = {}; if (a.s && typeof a.s === 'object') ACC_KEYS.forEach(k => { const v = numOr(a.s[k], 0, 0, 5); if (v) s[k] = r3(v); });
    return { u: a.u, t: a.t, r: Math.round(numOr(a.r, 0, 0, ACC_R.length - 1)), s, f: Math.floor(numOr(a.f, 1, 1, 999)), nm: Math.floor(numOr(a.nm, 0, 0, 1e7)), nw: a.nw ? 1 : 0, ...(ACC_SPECIAL[a.sp] && a.t === ACC_SPECIAL[a.sp].t ? { sp: a.sp } : {}) };
  });
}
function cleanAccSlots(o) { const out = { ring: null, bracelet: null, necklace: null }; if (o && typeof o === 'object') ACC_TYPES.forEach(t => { if (typeof o[t] === 'string' && /^a[a-z0-9]{4,12}$/.test(o[t])) out[t] = o[t]; }); return out; }
/* after loading: a pet only wears pieces the house owns, of the right kind, and no piece is worn twice */
function linkAccs(s) {
  const used = new Set(), byU = new Map((s.accs || []).map(a => [a.u, a]));
  [s].concat(s.others || []).forEach(p => { p.acc = cleanAccSlots(p.acc); ACC_TYPES.forEach(t => { const u = p.acc[t], a = u && byU.get(u); if (!a || a.t !== t || used.has(u)) p.acc[t] = null; else used.add(u); }); });
}
/* new pieces into the bag; past its size they are salvaged for coins */
function accBank(list) {
  const kept = [], scrapped = []; let coins = 0;
  if (!st.accs) st.accs = [];
  (list || []).forEach(a => { if (st.accs.length < ACC_BAG) { st.accs.push(a); kept.push(a); } else { scrapped.push(a); coins += ACC_R[a.r].scrap; } });
  if (coins) st.coins += coins;
  return { kept, scrapped: scrapped.length, coins };
}
/* ---- the pieces, drawn: a ring with a gem, a bangle set with three, a necklace and its pendant ---- */
function accSVG(a, o) {
  // every drawing gets its own gradient ids: a shared id would resolve to the first copy in the page, and if that one
  // sits in a hidden sheet the metal would not paint at all
  o = o || {}; const t = a.t, r = a.r, R = ACC_R[r], n = accSVG.n = (accSVG.n || 0) + 1, gid = `acm${n}`, hid = `ach${n}`, L = 'stroke="#2B2433" stroke-linejoin="round"';
  const defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${R.metal[0]}"/><stop offset="1" stop-color="${R.metal[1]}"/></linearGradient>${r >= 4 ? `<radialGradient id="${hid}"><stop offset="0" stop-color="${R.c}" stop-opacity=".55"/><stop offset="1" stop-color="${R.c}" stop-opacity="0"/></radialGradient>` : ''}</defs>`;
  const halo = r >= 4 ? `<circle cx="32" cy="32" r="31" fill="url(#${hid})"/>` : '';
  const spark = r >= 5 ? `<path d="M52 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFFFFF" stroke="#2B2433" stroke-width="1.2"/><path d="M11 46l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#FFFFFF"/>` : '';
  const gem = (x, y, s) => `<path d="M${x} ${y - s}L${x + s * 0.9} ${y - s * 0.2}L${x + s * 0.5} ${y + s * 0.9}L${x - s * 0.5} ${y + s * 0.9}L${x - s * 0.9} ${y - s * 0.2}Z" fill="${R.c}" ${L} stroke-width="2.2"/><path d="M${x - s * 0.9} ${y - s * 0.2}H${x + s * 0.9}M${x - s * 0.35} ${y - s * 0.2}L${x} ${y + s * 0.9}L${x + s * 0.35} ${y - s * 0.2}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.1"/><path d="M${x - s * 0.45} ${y - s * 0.45}L${x - s * 0.1} ${y - s * 0.8}" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`;
  let body = '';
  if (a.sp === 'orbit') { const oid = `aco${n}`; body = `<defs><radialGradient id="${oid}" cx=".35" cy=".35"><stop offset="0" stop-color="#4A4E6A"/><stop offset="1" stop-color="#0C0E1C"/></radialGradient></defs>`
      + `<ellipse cx="32" cy="34" rx="26" ry="10" transform="rotate(-18 32 34)" fill="none" stroke="#2B2433" stroke-width="7"/><ellipse cx="32" cy="34" rx="26" ry="10" transform="rotate(-18 32 34)" fill="none" stroke="#FFB43C" stroke-width="3.6"/>`
      + `<circle cx="32" cy="34" r="11" fill="url(#${oid})" stroke="#2B2433" stroke-width="2.4"/><path d="M32 28l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#FFFFFF"/>`
      + `<ellipse cx="32" cy="34" rx="18" ry="7" transform="rotate(24 32 34)" fill="none" stroke="#2B2433" stroke-width="6"/><ellipse cx="32" cy="34" rx="18" ry="7" transform="rotate(24 32 34)" fill="none" stroke="#4FD8FF" stroke-width="3"/>`
      + `<circle cx="56" cy="26" r="5.5" fill="#FFD36A" stroke="#2B2433" stroke-width="2"/><path d="M14 43a5 5 0 1 0 6 -6a4 4 0 1 1 -6 6z" fill="#BFF4FF" stroke="#2B2433" stroke-width="1.8"/>`; }
  else if (a.sp === 'veil') { const vid = `acv${n}`; body = `<defs><linearGradient id="${vid}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#F0EBDB"/><stop offset="1" stop-color="#B3AB95"/></linearGradient></defs>`
      // the black cord, a basalt clasp, and the talisman: an almond of calcite with its lid sealed, three lashes cut in it, an ochre band
      + `<path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="#2B2433" stroke-width="6.5" stroke-linecap="round"/><path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="#242428" stroke-width="3.4" stroke-linecap="round"/><path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="#A18E65" stroke-width="1.2" stroke-dasharray="2 5"/>`
      + `<rect x="27" y="37.5" width="10" height="7" rx="2" fill="#3A3A42" stroke="#2B2433" stroke-width="2.2"/>`
      + `<path d="M12 53Q32 36 52 53Q32 70 12 53Z" fill="url(#${vid})" stroke="#2B2433" stroke-width="2.6" stroke-linejoin="round"/>`
      + `<path d="M17 52.5Q32 44.5 47 52.5" fill="none" stroke="#A18E65" stroke-width="2.6" stroke-linecap="round"/><path d="M19 55Q32 61.5 45 55" fill="none" stroke="#242428" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M25 59.5l-1.5 3.5M32 61v4M39 59.5l1.5 3.5" fill="none" stroke="#242428" stroke-width="2" stroke-linecap="round"/><path d="M19 50.5Q25 47 30 46.5" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`; }
  else if (a.sp === 'bell') { const bid = `acb${n}`; body = `<defs><linearGradient id="${bid}" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#F2E8CF"/><stop offset=".55" stop-color="#D9C9A5"/><stop offset="1" stop-color="#A6957A"/></linearGradient></defs>`
      // the maroon cord with gold beads, a gold loop, the bone bell with its tarnished gold rim, the clapper peeping out
      + `<path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#2B2433" stroke-width="6.5" stroke-linecap="round"/><path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#341C2F" stroke-width="3.4" stroke-linecap="round"/><path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#A58A4E" stroke-width="1.6" stroke-dasharray="1.6 6"/>`
      + `<path d="M28.5 40a3.5 3.5 0 0 1 7 0" fill="none" stroke="#2B2433" stroke-width="4.4"/><path d="M28.5 40a3.5 3.5 0 0 1 7 0" fill="none" stroke="#D4B978" stroke-width="2"/>`
      + `<path d="M26 41Q24 46 22.5 55L20 59H44L41.5 55Q40 46 38 41Q32 38.5 26 41Z" fill="url(#${bid})" stroke="#2B2433" stroke-width="2.6" stroke-linejoin="round"/>`
      + `<path d="M21 55H43" stroke="#A58A4E" stroke-width="3"/><path d="M19 59.5Q32 63 45 59.5" fill="none" stroke="#6B5530" stroke-width="2.6" stroke-linecap="round"/>`
      + `<circle cx="32" cy="61.5" r="2.6" fill="#F2E8CF" stroke="#2B2433" stroke-width="1.6"/><path d="M27 44Q25.5 49 25 53" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`
      + `<path d="M48 44q3 3 0 6M51.5 42q5 5 0 10" fill="none" stroke="#DA8F86" stroke-width="1.8" stroke-linecap="round" opacity="${st && st.bellMute ? 0.2 : 0.85}"/>`; }
  else if (t === 'ring') body = `<ellipse cx="32" cy="41" rx="19" ry="13.5" fill="none" stroke="#2B2433" stroke-width="11"/><ellipse cx="32" cy="41" rx="19" ry="13.5" fill="none" stroke="url(#${gid})" stroke-width="6.5"/><path d="M16 45Q32 57 48 45" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.8" stroke-linecap="round"/><path d="M23 27L32 22L41 27L38 31H26Z" fill="url(#${gid})" ${L} stroke-width="2.4"/>${gem(32, 15, 9.5)}`;
  else if (t === 'bracelet') body = `<ellipse cx="32" cy="35" rx="24" ry="16" fill="none" stroke="#2B2433" stroke-width="15"/><ellipse cx="32" cy="35" rx="24" ry="16" fill="none" stroke="url(#${gid})" stroke-width="10"/><ellipse cx="32" cy="35" rx="24" ry="16" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="1.6" stroke-dasharray="5 4"/>${gem(17, 44, 5.5)}${gem(32, 50, 6.8)}${gem(47, 44, 5.5)}`;
  else body = `<path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="#2B2433" stroke-width="6.5" stroke-linecap="round"/><path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="${R.metal[1]}" stroke-width="3.2" stroke-linecap="round"/><path d="M11 6Q14 33 32 41Q50 33 53 6" fill="none" stroke="url(#${gid})" stroke-width="3.2" stroke-dasharray="3.5 2.4"/><rect x="27.5" y="38.5" width="9" height="6.5" rx="2.2" fill="url(#${gid})" ${L} stroke-width="2.2"/><path d="M32 45C41 51 41 59.5 32 62C23 59.5 23 51 32 45Z" fill="${R.c}" ${L} stroke-width="2.4"/><path d="M28.5 52.5Q29.5 49.5 32 48.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M32 48.5V60" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>`;
  return `<svg class="accsvg${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 64 64" aria-hidden="true">${defs}${halo}${body}${spark}</svg>`;
}
/* the same pieces on the Tower's floor, drawn on the canvas where they drop */
function accDraw(c, t, r, x, y, s, o) {
  const R = ACC_R[r], g = c.createLinearGradient(x, y - s, x + s * 0.4, y + s); g.addColorStop(0, R.metal[0]); g.addColorStop(1, R.metal[1]);
  const gemAt = (gx, gy, gs) => { c.fillStyle = R.c; c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.09); c.beginPath(); c.moveTo(gx, gy - gs); c.lineTo(gx + gs * 0.9, gy - gs * 0.2); c.lineTo(gx + gs * 0.5, gy + gs * 0.9); c.lineTo(gx - gs * 0.5, gy + gs * 0.9); c.lineTo(gx - gs * 0.9, gy - gs * 0.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(gx - gs * 0.3, gy - gs * 0.35, gs * 0.18, 0, 6.283); c.fill(); };
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (o && o.sp === 'orbit') { c.lineWidth = s * 0.2; for (const [rx, ry, rot, col] of [[0.9, 0.34, -0.3, '#FFB43C'], [0.62, 0.24, 0.42, '#4FD8FF']]) { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.22; c.beginPath(); c.ellipse(0, 0, s * rx, s * ry, 0, 0, 6.283); c.stroke(); c.strokeStyle = col; c.lineWidth = s * 0.12; c.stroke(); c.restore(); } c.fillStyle = '#141628'; c.beginPath(); c.arc(x, y, s * 0.36, 0, 6.283); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.08; c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, s * 0.09, 0, 6.283); c.fill(); }
  else if (o && o.sp === 'veil') { c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(x - s * 0.66, y - s * 0.8); c.quadraticCurveTo(x - s * 0.5, y + s * 0.1, x, y + s * 0.2); c.quadraticCurveTo(x + s * 0.5, y + s * 0.1, x + s * 0.66, y - s * 0.8); c.stroke(); c.strokeStyle = '#242428'; c.lineWidth = s * 0.1; c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.62, y + s * 0.55); c.quadraticCurveTo(x, y + s * 0.02, x + s * 0.62, y + s * 0.55); c.quadraticCurveTo(x, y + s * 1.08, x - s * 0.62, y + s * 0.55); c.closePath(); const vg = c.createLinearGradient(x - s * 0.6, y, x + s * 0.3, y + s); vg.addColorStop(0, '#F0EBDB'); vg.addColorStop(1, '#B3AB95'); c.fillStyle = vg; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.09); c.stroke();
    c.strokeStyle = '#A18E65'; c.lineWidth = Math.max(1, s * 0.08); c.beginPath(); c.moveTo(x - s * 0.45, y + s * 0.52); c.quadraticCurveTo(x, y + s * 0.28, x + s * 0.45, y + s * 0.52); c.stroke(); c.strokeStyle = '#242428'; c.beginPath(); c.moveTo(x - s * 0.4, y + s * 0.6); c.quadraticCurveTo(x, y + s * 0.8, x + s * 0.4, y + s * 0.6); c.stroke(); for (const u of [-0.22, 0, 0.22]) { c.beginPath(); c.moveTo(x + u * s, y + s * 0.78); c.lineTo(x + u * s * 1.3, y + s * 0.95); c.stroke(); } }
  else if (o && o.sp === 'bell') { c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(x - s * 0.66, y - s * 0.8); c.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x, y + s * 0.12); c.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.66, y - s * 0.8); c.stroke(); c.strokeStyle = '#341C2F'; c.lineWidth = s * 0.1; c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.2, y + s * 0.2); c.quadraticCurveTo(x - s * 0.28, y + s * 0.5, x - s * 0.38, y + s * 0.82); c.lineTo(x + s * 0.38, y + s * 0.82); c.quadraticCurveTo(x + s * 0.28, y + s * 0.5, x + s * 0.2, y + s * 0.2); c.quadraticCurveTo(x, y + s * 0.1, x - s * 0.2, y + s * 0.2); c.closePath(); const bg = c.createLinearGradient(x - s * 0.4, y, x + s * 0.4, y); bg.addColorStop(0, '#F2E8CF'); bg.addColorStop(1, '#A6957A'); c.fillStyle = bg; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.09); c.stroke();
    c.strokeStyle = '#A58A4E'; c.lineWidth = Math.max(1, s * 0.09); c.beginPath(); c.moveTo(x - s * 0.36, y + s * 0.7); c.lineTo(x + s * 0.36, y + s * 0.7); c.stroke(); c.fillStyle = '#F2E8CF'; c.beginPath(); c.arc(x, y + s * 0.92, s * 0.09, 0, 6.283); c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.05); c.stroke(); }
  else if (t === 'ring') { c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.34; c.beginPath(); c.ellipse(x, y + s * 0.28, s * 0.6, s * 0.42, 0, 0, 6.283); c.stroke(); c.strokeStyle = g; c.lineWidth = s * 0.2; c.stroke(); gemAt(x, y - s * 0.42, s * 0.32); }
  else if (t === 'bracelet') { c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.44; c.beginPath(); c.ellipse(x, y, s * 0.72, s * 0.48, 0, 0, 6.283); c.stroke(); c.strokeStyle = g; c.lineWidth = s * 0.3; c.stroke(); gemAt(x, y + s * 0.48, s * 0.22); }
  else { c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(x - s * 0.66, y - s * 0.8); c.quadraticCurveTo(x - s * 0.5, y + s * 0.1, x, y + s * 0.2); c.quadraticCurveTo(x + s * 0.5, y + s * 0.1, x + s * 0.66, y - s * 0.8); c.stroke(); c.strokeStyle = g; c.lineWidth = s * 0.1; c.stroke(); c.fillStyle = R.c; c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.09); c.beginPath(); c.moveTo(x, y + s * 0.22); c.bezierCurveTo(x + s * 0.32, y + s * 0.42, x + s * 0.3, y + s * 0.78, x, y + s * 0.86); c.bezierCurveTo(x - s * 0.3, y + s * 0.78, x - s * 0.32, y + s * 0.42, x, y + s * 0.22); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
}
