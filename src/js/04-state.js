/* ---------- the saved pet ---------- */
let st = null;
let running = false;
let hatchedThisSession = false;
let loadedSavedAt = 0;
let awayMs = 0;
let cozyCache = -1;

const uidGen = () => 'i' + Math.random().toString(36).slice(2, 9);
function starterItems() {
  return [
    { u: uidGen(), id: 'rug_round', fx: 0.5, fy: 0.5, flip: false },
    { u: uidGen(), id: 'bed_basic', fx: 0.1, fy: 0.86, flip: false },
    { u: uidGen(), id: 'bowl', fx: 0.92, fy: 0.9, flip: false },
    { u: uidGen(), id: 'plant_fern', fx: 0.94, fy: 0.08, flip: false },
    { u: uidGen(), id: 'frame_pet', fx: 0.2, fy: 0.5, flip: false },
  ];
}
/* ---------- the save: a household of pets in a house ----------
   The active pet's fields sit at the top of st (as in earlier versions); the other pets wait in st.others.
   st.room always points at the room you are in: st.house.rooms[st.house.cur]. */
const PET_KEYS = ['uid', 'name', 'dna', 'forms', 'rarity', 'hatchedAt', 'food', 'joy', 'energy', 'clean', 'asleep', 'ageH', 'stage', 'xp',
  'streak', 'bestStreak', 'lastFedDay', 'meals', 'pats', 'kicks', 'pops', 'catches', 'digs', 'baths', 'seeks', 'tricks', 'digWait', 'evoResets', 'paid', 'dlv', 'dxp', 'deck', 'fusedFrom', 'gen', 'abOv', 'acc'];
const MAX_PETS = 50, MAX_ROOMS = 9;
const petUid = () => 'p' + Math.random().toString(36).slice(2, 9);
/* genome = { dna: {seed, personality, size}, form } from makeGenome() */
function newPetFields(name, genome) {
  return {
    uid: petUid(), name, dna: genome.dna, forms: [genome.form], rarity: rarityOf(genome.form), hatchedAt: Date.now(),
    food: 75, joy: 80, energy: 90, clean: 95, asleep: false, ageH: 0, stage: 1, xp: 0,
    streak: 0, bestStreak: 0, lastFedDay: null, meals: 0, pats: 0, kicks: 0, pops: 0, catches: 0, digs: 0, baths: 0, seeks: 0,
    tricks: {}, digWait: 0, evoResets: 0, paid: {},
    dlv: 1, dxp: 0, deck: { normal: null, strong: null, ult: null },   // Dungeon level, its experience, and equipped ability cards
    acc: { ring: null, bracelet: null, necklace: null },   // the accessories it wears (ids into the house's bag, st.accs)
    fusedFrom: null, gen: 0, abOv: null,   // abilities inherited from fusion parents: { normal: {shot}, strong: {key, tier}, ult: {key, tier} }   // parents' names and generation when the pet came from a fusion
  };
}
function newRoom(type, n) {
  const T = ROOM_TYPES[type] || ROOM_TYPES.living;
  const r = { id: 'r' + n, type: ROOM_TYPES[type] ? type : 'living', name: T.name, theme: T.theme || 'meadow', items: T.starter() };
  if (r.type === 'farm') r.plots = newPlots();
  return r;
}
const newPlots = () => Array.from({ length: 6 }, () => ({ crop: null, g: 0, water: false }));
function linkRoom(s) {
  s.house.cur = clamp(Math.floor(s.house.cur) || 0, 0, s.house.rooms.length - 1);
  s.room = s.house.rooms[s.house.cur];
}
function newState(name, genome) {
  const t = Date.now();
  const s = Object.assign(newPetFields(name, genome), {
    v: 4, hid: 'h' + t.toString(36), savedAt: t, lightsOff: false, gems: {}, coins: 300, pearls: 10, crystals: 0, fusionStones: 0, fuseRolls: 0, lastGiftDay: null, animas: { have: {}, eq: null, res: null, seen: {} },
    house: { rooms: [newRoom('living', 1), newRoom('shop', 2)], cur: 0, n: 2, name: '', paint: 'cream', roof: 'terracotta' }, inv: {}, themes: ['meadow'], pantry: {}, others: [],
    map: { stars: {}, best: {}, plays: 0, milestones: {} },
    cards: {}, accs: [], dun: { best: 0, runs: 0, kills: 0, boxes: 0, pity: 0, god: false, tab: 'world', seen: {}, grades: {} }, rift: { seals: {}, prog: {}, gates: {}, rlyeh: 0 },
    sound: true, retro: true, fast: false, tips: {}, dev: false, unlockAll: false,
    welcome: 0, freeTen: 0, login: { m: '', n: 0, last: '', seen: '' },
  });
  linkRoom(s);
  return s;
}
/* the pet's current look */
const formOf = p => p.forms[p.stage - 1] || p.forms[p.forms.length - 1];
const curForm = () => formOf(st);
const petScaleTarget = () => { const L = legScale(st); return (L != null ? L : STAGES[st.stage].scale * (curForm().grow || 1)) * (st.dna.size || 1); };
/* fill in looks for any stage the save doesn't have yet (old saves, dev jumps) */
function growForms(s, R) {
  R = R || Math.random;
  while (s.forms.length < s.stage) s.forms.push(evolveForm(s.forms[s.forms.length - 1], R, s.forms.length + 1).form);
  if (s.forms.length > s.stage) s.forms.length = s.stage;
}
function migrateV1(o) {
  const R = mulberry32(Math.floor(o.hatchedAt) % 2147483647 || 7);
  const genome = makeGenome(R);
  genome.form.pal = legacyPal(o.coat, R);
  const s = newState(String(o.name || 'Pip').slice(0, 14), genome);
  s.rarity = rarityOf(genome.form);
  s.hatchedAt = o.hatchedAt; s.savedAt = o.savedAt || Date.now(); s.hid = 'h' + Math.floor(o.hatchedAt);
  ['food', 'joy', 'energy', 'ageH', 'streak', 'bestStreak', 'meals', 'pats', 'kicks'].forEach(k => { if (typeof o[k] === 'number') s[k] = clamp(o[k], 0, k === 'ageH' || k.endsWith('s') || k.includes('treak') ? 1e7 : 100); });
  s.lastFedDay = typeof o.lastFedDay === 'string' ? o.lastFedDay : null;
  s.asleep = !!o.asleep; s.lightsOff = !!o.lightsOff; s.sound = o.sound !== false; s.retro = o.retro !== false; s.fast = !!o.fast; s.lowFx = !!o.lowFx; s.bellMute = !!o.bellMute; s.devMoves = !!o.devMoves;
  const g = +o.growth || 0;
  s.stage = g >= 96 ? 3 : g >= 24 ? 2 : 1;
  growForms(s, R);
  s.xp = Math.round((+o.ageH || 0) * 4 + (+o.meals || 0) * 6 + (+o.pats || 0));
  s.coins = 300 + (+o.meals || 0) * 10;
  return s;
}
const numOr = (v, d, lo = -Infinity, hi = Infinity) => (typeof v === 'number' && isFinite(v)) ? clamp(v, lo, hi) : d;
/* one pet's own fields, checked; v is the save version it came from */
function sanitizePet(o, v) {
  if (!o || typeof o !== 'object' || typeof o.name !== 'string' || !o.hatchedAt) return null;
  const num = numOr;
  const pers = o.dna && PERSONALITIES.some(p => p.id === o.dna.personality) ? o.dna.personality : 'playful';
  let forms;
  if (v >= 3) {
    forms = Array.isArray(o.forms) ? o.forms.slice(0, 7).map(cleanForm).filter(Boolean) : [];
    if (!forms.length) return null;
  } else {
    // a version 2 pet: rebuild its look from the old genes, then grow it to its stage
    if (!o.dna || typeof o.dna !== 'object') return null;
    forms = [formFromLegacy(o.dna)];
  }
  const dna = { v: 3, seed: Math.floor(num(o.dna && o.dna.seed, forms[0].seed, 1, 2e9)), personality: pers, size: v === 2 ? 1 : num(o.dna && o.dna.size, 1, 0.9, 1.1) };
  const p = newPetFields(o.name.replace(/[<>]/g, '').slice(0, 14) || 'Pip', { dna, form: forms[0] });
  if (typeof o.uid === 'string' && /^p[a-z0-9]{3,12}$/.test(o.uid)) p.uid = o.uid;
  p.forms = forms; legendFix(p);
  p.rarity = Math.round(num(o.rarity, rarityOf(forms[0]), 0, 5));
  p.hatchedAt = num(o.hatchedAt, Date.now());
  p.food = num(o.food, 60, 0, 100); p.joy = num(o.joy, 60, 0, 100); p.energy = num(o.energy, 60, 0, 100); p.clean = num(o.clean, 80, 0, 100);
  p.asleep = !!o.asleep;
  p.ageH = num(o.ageH, 0, 0); p.stage = Math.round(num(o.stage, 1, 1, 7)); p.xp = num(o.xp, 0, 0);
  growForms(p, mulberry32(forms[0].seed ^ 0x2545F491));
  p.evoResets = Math.floor(num(o.evoResets, 0, 0, 1e6));
  if (v === 2) for (let n = 2; n <= p.stage; n++) p.paid[n] = true;
  else if (o.paid && typeof o.paid === 'object') for (const n in o.paid) if (/^[2-7]$/.test(n) && +n <= p.stage && o.paid[n] === true) p.paid[n] = true;
  p.streak = num(o.streak, 0, 0); p.bestStreak = num(o.bestStreak, 0, 0);
  p.lastFedDay = typeof o.lastFedDay === 'string' ? o.lastFedDay : null;
  ['meals', 'pats', 'kicks', 'pops', 'catches', 'digs', 'baths', 'seeks'].forEach(k => { p[k] = num(o[k], 0, 0); });
  p.digWait = num(o.digWait, 0, 0, 24);
  if (o.tricks && typeof o.tricks === 'object') TRICKS.forEach(t => { const n = num(o.tricks[t.id], 0, 0, 999); if (n) p.tricks[t.id] = Math.floor(n); });
  p.dlv = Math.floor(num(o.dlv, 1, 1, DLV_MAX)); p.dxp = Math.floor(num(o.dxp, 0, 0, 1e7)); p.deck = cleanDeck(o.deck); p.acc = cleanAccSlots(o.acc);
  if (o.abOv && typeof o.abOv === 'object') { const ov = {}; ['normal', 'strong', 'ult'].forEach(k => { const v = o.abOv[k]; if (v && typeof v === 'object' && (typeof v.key === 'string' || typeof v.shot === 'string')) ov[k] = { key: typeof v.key === 'string' ? v.key.slice(0, 24) : undefined, shot: typeof v.shot === 'string' ? v.shot.slice(0, 16) : undefined, tier: Math.round(num(v.tier, 3, 3, 6)) }; }); p.abOv = Object.keys(ov).length ? ov : null; }
  if (Array.isArray(o.fusedFrom) && o.fusedFrom.length === 2 && o.fusedFrom.every(n => typeof n === 'string')) p.fusedFrom = o.fusedFrom.map(n => n.replace(/[<>]/g, '').slice(0, 14));
  p.gen = Math.floor(num(o.gen, 0, 0, 99));
  return p;
}
function cleanItems(list) {
  return (Array.isArray(list) ? list : []).filter(i => i && ITEMS[i.id]).slice(0, 60).map(i => ({ u: typeof i.u === 'string' ? i.u.slice(0, 16) : uidGen(), id: i.id, fx: numOr(i.fx, 0.5, 0, 1), fy: numOr(i.fy, 0.5, 0, 1), flip: !!i.flip }));
}
function cleanRoom(r, n) {
  if (!r || typeof r !== 'object') return null;
  const type = ROOM_TYPES[r.type] ? r.type : 'living', T = ROOM_TYPES[type];
  const out = { id: 'r' + n, type, name: (typeof r.name === 'string' ? r.name.replace(/[<>]/g, '').trim().slice(0, 18) : '') || T.name, theme: THEMES.some(t => t.id === r.theme) ? r.theme : (T.theme || 'meadow'), items: cleanItems(r.items) };
  if (type === 'farm') {
    out.plots = newPlots();
    if (Array.isArray(r.plots)) r.plots.slice(0, 6).forEach((q, i) => { if (q && CROPS[q.crop]) out.plots[i] = { crop: q.crop, g: numOr(q.g, 0, 0, 1e4), water: !!q.water }; });
  }
  return out;
}
function sanitize(o) {
  if (!o || typeof o !== 'object' || typeof o.name !== 'string' || !o.hatchedAt) return null;
  if (o.v !== 2 && o.v !== 3 && o.v !== 4) return migrateV1(o);
  const num = numOr;
  const pet = sanitizePet(o, o.v);
  if (!pet) return null;
  const s = newState(pet.name, { dna: pet.dna, form: pet.forms[0] });
  Object.assign(s, pet);
  s.hid = typeof o.hid === 'string' && /^h[a-z0-9]{3,16}$/.test(o.hid) ? o.hid : 'h' + Math.floor(num(o.hatchedAt, Date.now()));
  s.savedAt = num(o.savedAt, Date.now());
  s.lightsOff = !!o.lightsOff;
  s.dev = !!o.dev; s.unlockAll = !!o.unlockAll; s.dev6 = !!o.dev6;
  if (o.map && typeof o.map === 'object') {
    const okKey = k => /^w[1-9]s[1-9]$/.test(k);
    if (o.map.stars && typeof o.map.stars === 'object') for (const k in o.map.stars) if (okKey(k)) s.map.stars[k] = Math.round(num(o.map.stars[k], 0, 0, 3));
    if (o.map.best && typeof o.map.best === 'object') for (const k in o.map.best) if (okKey(k)) s.map.best[k] = Math.floor(num(o.map.best[k], 0, 0, 1e9));
    if (o.map.milestones && typeof o.map.milestones === 'object') for (const k in o.map.milestones) if (/^m\d{1,3}$/.test(k) && o.map.milestones[k] === true) s.map.milestones[k] = true;
    s.map.plays = Math.floor(num(o.map.plays, 0, 0, 1e7));
  }
  s.coins = Math.floor(num(o.coins, 0, 0, 1e9)); s.pearls = Math.floor(num(o.pearls, 0, 0, 1e7));
  s.crystals = Math.floor(num(o.crystals, 0, 0, 1e9)); s.fusionStones = Math.floor(num(o.fusionStones, 0, 0, 999)); s.fuseRolls = Math.floor(num(o.fuseRolls, 0, 0, 1e6)); s.summons = Math.floor(num(o.summons, 0, 0, 1e9)); s.lv10Eggs = o.lv10Eggs ? 1 : 0; s.lv10Owed = Math.floor(num(o.lv10Owed, 0, 0, 9));
  // (the welcome gift waits only on a save made with it waiting: older saves had their start long ago)
  s.welcome = o.welcome === 0 ? 0 : 1;
  s.freeTen = Math.max(0, Math.min(9, Math.floor(+o.freeTen || 0)));   /* free 10-egg summons waiting (the welcome gift's) */
  { const L = o.login && typeof o.login === 'object' ? o.login : {}, str = (v, re) => typeof v === 'string' && re.test(v) ? v : ''; s.login = { m: str(L.m, /^\d{4}-\d{2}$/), n: Math.floor(num(L.n, 0, 0, 31)), last: str(L.last, /^\d{4}-\d{2}-\d{2}$/), seen: str(L.seen, /^\d{4}-\d{2}-\d{2}$/) }; } s.pity10 = Math.floor(num(o.pity10, 0, 0, PITY_N));
  s.lastGiftDay = typeof o.lastGiftDay === 'string' ? o.lastGiftDay : null;
  if (o.animas && typeof o.animas === 'object') {
    const A = o.animas, h = A.have && typeof A.have === 'object' ? A.have : {};
    ANIMA_ORDER.forEach(id => { const k = Math.floor(num(h[id], 0, 0, 3)); if (k) s.animas.have[id] = k; if (A.seen && A.seen[id] === true) s.animas.seen[id] = true; });
    if (s.animas.have[A.eq]) s.animas.eq = A.eq;
    if (s.animas.eq && s.animas.have[A.res] && A.res !== s.animas.eq) s.animas.res = A.res;   // an opposite pair, or any pair in Astral Harmony
  }
  if (o.gems && typeof o.gems === 'object') GEM_ORDER.forEach(k => { const n = num(o.gems[k], 0, 0, 99); if (n) s.gems[k] = Math.floor(n); });
  // the house: version 4 saves have rooms; older ones had a single room
  let rooms = [];
  if (o.v === 4 && o.house && Array.isArray(o.house.rooms)) rooms = o.house.rooms.slice(0, MAX_ROOMS).map((r, i) => cleanRoom(r, i + 1)).filter(Boolean);
  else if (o.room && typeof o.room === 'object') rooms = [cleanRoom(Object.assign({}, o.room, { type: 'living', name: 'Living room' }), 1)];
  if (!rooms.length) rooms = [newRoom('living', 1)];
  if (!rooms.some(r => r.type === 'shop')) rooms.push(newRoom('shop', rooms.length + 1));   // every house has the shop
  rooms.forEach(r => { if (r.type === 'shop') { r.items = ROOM_TYPES.shop.starter(); r.theme = 'shop'; r.name = 'Shop'; } });   // its fixtures are always the current set
  rooms.forEach((r, i) => { r.id = 'r' + (i + 1); });
  if (!rooms.some(r => r.items.some(i => i.id === 'bowl'))) { const home = rooms.find(r => r.type === 'kitchen') || rooms.find(r => !ROOM_TYPES[r.type].outdoor) || rooms[0]; home.items.push({ u: uidGen(), id: 'bowl', fx: 0.92, fy: 0.9, flip: false }); }
  s.house = { rooms, cur: o.house && o.v === 4 ? num(o.house.cur, 0, 0, rooms.length - 1) : 0, n: rooms.length, name: '', paint: 'cream', roof: 'terracotta' };
  s.town = o.town && typeof o.town === 'object' ? { x: num(o.town.x, 0, 0, 2000), y: num(o.town.y, 0, 0, 2000), walked: !!o.town.walked } : null;
  if (o.house && typeof o.house === 'object') { const h = o.house; if (typeof h.name === 'string') s.house.name = h.name.replace(/[<>]/g, '').trim().slice(0, 18); if (PAINTS.some(p => p.id === h.paint)) s.house.paint = h.paint; if (ROOFS.some(p => p.id === h.roof)) s.house.roof = h.roof; }
  if (o.inv && typeof o.inv === 'object') for (const k in o.inv) if (ITEMS[k] && k !== 'bowl') { const n = Math.floor(num(o.inv[k], 0, 0, 99)); if (n) s.inv[k] = n; }
  if (Array.isArray(o.themes)) s.themes = ['meadow'].concat(o.themes.filter(t => t !== 'meadow' && THEMES.some(x => x.id === t)));
  if (o.pantry && typeof o.pantry === 'object') PANTRY_KEYS.forEach(k => { const n = Math.floor(num(o.pantry[k], 0, 0, 999)); if (n) s.pantry[k] = n; });
  if (o.cards && typeof o.cards === 'object') for (const k in o.cards) if (CARDS[k]) { const n = Math.floor(num(o.cards[k], 0, 0, CARD_MAX_LV)); if (n) s.cards[k] = n; }
  if (o.dun && typeof o.dun === 'object') {
    const d = o.dun;
    Object.assign(s.dun, { best: Math.floor(num(d.best, 0, 0, 999)), runs: Math.floor(num(d.runs, 0, 0, 1e7)), kills: Math.floor(num(d.kills, 0, 0, 1e9)), boxes: Math.floor(num(d.boxes, 0, 0, 1e6)), pity: Math.floor(num(d.pity, 0, 0, GIFT_PITY)), god: !!d.god, tab: d.tab === 'dungeon' ? 'dungeon' : d.tab === 'town' ? 'town' : d.tab === 'rift' ? 'rift' : 'world', seen: {}, grades: {} });
    if (d.seen && typeof d.seen === 'object') Object.keys(d.seen).slice(0, 140).forEach(k => { if (/^[a-z]{2,24}$/.test(k) && typeof d.seen[k] === 'number') s.dun.seen[k] = Math.floor(num(d.seen[k], 0, 0, 1e9)); });
    if (d.grades && typeof d.grades === 'object') Object.keys(d.grades).forEach(n => { const f = Math.floor(+n), v = Math.floor(num(d.grades[n], 0, 0, 4)); if (f >= 1 && f <= 999 && v >= 1) s.dun.grades[f] = v; });
  }
  // the rifts: which are sealed, the checkpoint in each, which gates' trials are done
  if (o.rift && typeof o.rift === 'object') { const r = o.rift, idOK = k => /^[a-z]{2,16}$/.test(k);
    ['seals', 'gates'].forEach(f => { if (r[f] && typeof r[f] === 'object') Object.keys(r[f]).slice(0, 20).forEach(k => { if (idOK(k) && r[f][k]) s.rift[f][k] = 1; }); });
    if (r.prog && typeof r.prog === 'object') Object.keys(r.prog).slice(0, 20).forEach(k => { if (idOK(k)) s.rift.prog[k] = Math.floor(num(r.prog[k], 0, 0, 5)); });
    s.rift.rlyeh = r.rlyeh ? 1 : 0; }
  if (o.v === 4 && Array.isArray(o.others)) s.others = o.others.slice(0, MAX_PETS - 1).map(p => sanitizePet(p, 4)).filter(Boolean);
  const seen = new Set([s.uid]);
  s.others.forEach(p => { if (seen.has(p.uid)) p.uid = petUid(); seen.add(p.uid); });
  [s].concat(s.others).forEach(p => SLOTS.forEach(k => { if (p.deck[k] && !s.cards[p.deck[k]]) p.deck[k] = null; }));   // only cards the house owns
  s.accs = cleanAccs(o.accs); linkAccs(s);   // the accessory bag, and only pieces from it worn, each by one pet
  // the party: up to three pets beside the one you play, each one you still have, none twice
  if (Array.isArray(o.party)) { const ok = new Set(s.others.map(p => p.uid)), seen2 = new Set(); s.party = o.party.filter(u => typeof u === 'string' && ok.has(u) && u !== s.uid && !seen2.has(u) && seen2.add(u)).slice(0, 3); }
  s.sound = o.sound !== false; s.retro = o.retro !== false; s.fast = !!o.fast; s.lowFx = !!o.lowFx; s.bellMute = !!o.bellMute; s.devMoves = !!o.devMoves;
  if (o.tips && typeof o.tips === 'object') for (const k in o.tips) if (o.tips[k] === true && k.length < 20) s.tips[k] = true;
  linkRoom(s);
  return s;
}
function serialize() {
  st.savedAt = Date.now();
  const o = Object.assign({}, st);
  delete o.room;
  return JSON.parse(JSON.stringify(o));
}

/* ---------- needs over time ---------- */
function clampStats(s) { s.food = clamp(s.food, 0, 100); s.joy = clamp(s.joy, 0, 100); s.energy = clamp(s.energy, 0, 100); s.clean = clamp(s.clean, 0, 100); }
function cozyScore() {
  if (cozyCache >= 0) return cozyCache;
  let c = 0;
  if (st) for (const i of st.room.items) c += ITEMS[i.id].cozy || 0;
  cozyCache = c;
  return c;
}
/* the best bed anywhere in the house; beds in a bedroom count extra */
function bestBedCozy(house) {
  let b = 0;
  if (house) for (const r of house.rooms) for (const i of r.items) if (ITEMS[i.id].act === 'sleep') b = Math.max(b, ITEMS[i.id].cozy * (r.type === 'bedroom' ? 1.3 : 1));
  return b;
}
const hasRoom = (house, type) => !!house && house.rooms.some(r => r.type === type);
function applyHours(s, h, asleep, house) {
  house = house || s.house || (st && st.house);
  const P = s.dna.personality, here = s === st && s.room ? s.room.type : null;
  const cozyMul = 1 - Math.min(0.4, (s === st ? cozyScore() : 10) * 0.01);
  const placeMul = here === 'garden' || here === 'farm' ? 0.6 : here === 'playroom' ? 0.8 : 1;
  if (asleep) {
    const bedMul = (1 + Math.max(0, bestBedCozy(house) - 3) * 0.05) * (hasRoom(house, 'bedroom') ? 1.2 : 1);
    s.food -= 1.6 * h; s.joy -= 0.3 * h; s.energy += 14 * h * bedMul; s.clean -= 0.4 * h;
  } else {
    s.food -= 4.2 * h * (P === 'foodie' ? 1.2 : 1);
    s.joy -= 2.4 * h * cozyMul * placeMul;
    s.energy -= 4 * h * (P === 'sleepy' ? 0.75 : 1);
    s.clean -= 1.4 * h;
  }
  if (s.food < 20) s.joy -= 3 * h;
  if (!asleep && s.energy < 15) s.joy -= 1.5 * h;
  if (s.clean < 25) s.joy -= 1.2 * h;
  if (s.food >= 25 && s.joy >= 25) s.xp += 4 * h;
  s.ageH += h;
  s.digWait = Math.max(0, s.digWait - h);
  clampStats(s);
}
/* pets you are not playing with keep each other company: their needs drop more slowly */
const OTHER_RATE = 0.6;
function simulatePet(p, from, end, house, k) {
  let t = from, napping = p.asleep && p.energy < 80;
  while (t < end) {
    const span = Math.min(15 * 60e3, end - t);
    if (p.energy < 12) napping = true; else if (napping && p.energy > 85) napping = false;
    applyHours(p, span / 36e5 * (k || 1), isNightAt(t + span / 2) || napping, house);
    t += span;
  }
}
/* crops grow in real time (and in fast-forward pet hours while the app is open) */
function growFarm(s, h) {
  if (!s || !s.house || !(h > 0)) return false;
  let changed = false;
  for (const r of s.house.rooms) if (r.plots) for (const p of r.plots) {
    if (!p.crop) continue;
    const need = CROPS[p.crop].hours;
    if (p.g >= need) continue;
    const before = p.g;
    p.g = Math.min(need, p.g + h * (p.water ? 2 : 1));
    if (Math.floor(before / need * 4) !== Math.floor(p.g / need * 4)) changed = true;
  }
  return changed;
}
// Simulate the time the app was closed: pets sleep at night and nap when worn out.
function catchUp(s, to) {
  const from = s.savedAt;
  if (!(to > from + 1000)) return 0;
  const end = Math.min(to, from + 14 * 864e5);
  simulatePet(s, from, end, s.house, 1);
  (s.others || []).forEach(o => simulatePet(o, from, end, s.house, OTHER_RATE));
  growFarm(s, (end - from) / 36e5);
  const away = to - from;
  if (away > 30 * 60e3) {
    const night = isNightAt(to);
    if (s.lightsOff && !night) s.lightsOff = false;
    s.asleep = s.lightsOff || night || s.energy < 15;
    (s.others || []).forEach(o => { o.asleep = night || o.energy < 15; });
  }
  s.savedAt = to;
  return away;
}
function mood() {
  if (st.asleep) return 'asleep';
  if (st.food < 20) return 'hungry';
  if (st.energy < 15) return 'tired';
  if (st.clean < 20) return 'dirty';
  if (st.joy < 25) return 'sad';
  if (st.joy > 72 && st.food > 35) return 'joyful';
  return 'content';
}
function currentNeed() {
  if (st.food < 25) return 'food';
  if (st.energy < 18) return 'moon';
  if (st.clean < 25) return 'bath';
  if (st.joy < 30) return 'ball';
  return null;
}

/* ---------- bond, evolution and money ---------- */
function bondInfo(xp) {
  let L = 1, need = 140, x = xp;
  while (x >= need && L < 99) { x -= need; L++; need = 100 + 40 * L; }
  return { level: L, into: x, need };
}
/* bond for play. A mini-game played to its end, won or lost, is worth a whole bond level to the pet that played it; a
   cleared Tower floor is worth a third of a level to every pet in the party. A level is what the pet's current level
   needs in full, so a pet partway into a level keeps its progress */
const bondLevelOf = p => bondInfo((p || st).xp || 0).need;
/* the bond that carries a pet up n whole levels from where it is, keeping its progress into the level (a heart tart's
   two, a kindred sundae's three) */
function bondFoodXP(p, n) { const b = bondInfo((p || st).xp || 0); let x = 0; for (let i = 0; i < n && b.level + i < 99; i++) x += 100 + 40 * (b.level + i); return x; }
function addBondTo(p, n) {
  if (!st || !p || !(n > 0)) return;
  if (p === st) { addXP(n); return; }
  const before = bondInfo(p.xp || 0).level; p.xp = (p.xp || 0) + n; const after = bondInfo(p.xp).level;
  if (after > before) { const gift = 20 * after; st.coins += gift; toast(`${p.name}: bond level ${after}! +${gift} coins`); }
}
/* p is the active pet (st) or a pet waiting in st.others; the gem pouch is shared by the whole house */
function evoStatusOf(p) {
  if (!st || !p || !(p.stage < 7)) return null;
  const nx = STAGES[p.stage + 1], b = bondInfo(p.xp);
  return { nx, level: b.level, bondOk: b.level >= nx.bond, gemOk: (st.gems[nx.gem] || 0) > 0, crystalOk: (st.crystals || 0) >= EVO_CRYSTALS };
}
const EVO_CRYSTALS = 500;   // every evolution also costs crystals
function evoStatus() { return evoStatusOf(st); }
function evoReadyOf(p) { const e = evoStatusOf(p); return !!(e && e.bondOk && e.gemOk && e.crystalOk); }
const evoReady = () => evoReadyOf(st);
function coinMul() { return (st.stage >= 5 ? 1.2 : st.stage >= 3 ? 1.1 : 1) * (!arc.open && st.room && st.room.type === 'playroom' ? 1.25 : 1); }
function addXP(n) {
  if (!st || n <= 0) return;
  const before = bondInfo(st.xp).level;
  st.xp += n;
  const after = bondInfo(st.xp).level;
  if (after > before) {
    const gift = 20 * after;
    st.coins += gift;
    toast(`Bond level ${after}! +${gift} coins`);
    sfx.sparkle();
    const e = evoStatus();
    if (e && after >= e.nx.bond && before < e.nx.bond) setTimeout(() => { if (running) toast(e.gemOk ? 'Ready to evolve! Open the card.' : `Bond is ready to evolve. Win a ${GEMS[e.nx.gem].name} ${gemWhere(e.nx.gem)} on the adventure map, or dig for one.`, 3600); }, 2600);
  }
  updateHud();
}
function addCoins(n, x, y) {
  n = Math.max(0, Math.round(n));
  if (!n) return;
  st.coins += n;
  if (x != null) floatText(`+${n}`, x, y, ICON.coin);
  sfx.coin();
  updateHud();
}
function addPearls(n, x, y) {
  st.pearls += n;
  if (x != null) floatText(`+${n}`, x, y, ICON.pearl);
  updateHud();
}
function spend(price) {
  if (!price) return true;
  if (price.p) { if (st.pearls < price.p) return false; st.pearls -= price.p; }
  else { if (st.coins < price.c) return false; st.coins -= price.c; }
  updateHud();
  return true;
}
function giveGem(key, x, y) {
  st.gems[key] = (st.gems[key] || 0) + 1;
  if (x != null) floatText(GEMS[key].name, x, y);
  updateHud();
}
function registerMeal() {
  const today = dayKey(Date.now());
  if (st.lastFedDay === today) return false;
  const gap = dayGap(st.lastFedDay, today);
  st.streak = gap === 1 ? st.streak + 1 : 1;
  st.bestStreak = Math.max(st.bestStreak, st.streak);
  st.lastFedDay = today;
  return true;
}
const shownStreak = () => dayGap(st.lastFedDay, dayKey(Date.now())) <= 1 ? st.streak : 0;
function streakReward() {
  // Daily care pays out: day 3 brings the next gemstone, every 7th day brings pearls.
  const e = evoStatus();
  if (st.streak === 3 && e && !e.gemOk) { st.gems[e.nx.gem] = (st.gems[e.nx.gem] || 0) + 1; return `3 days in a row! Here's a ${GEMS[e.nx.gem].name}.`; }
  if (st.streak > 0 && st.streak % 7 === 0) { st.pearls += 5; return `${st.streak} days in a row! +5 pearls.`; }
  return null;
}
function dailyGift() {
  const today = dayKey(Date.now());
  if (st.lastGiftDay === today) return;
  const first = !st.lastGiftDay;
  st.lastGiftDay = today;
  if (first) return;
  // (the day's reward is the daily rewards calendar's now, 22b; a visit still brings a little experience)
  addXP(25);
}
function weightG() {
  const base = [0, 90, 160, 260, 380, 520, 680, 860][st.stage];
  return Math.round(base * st.dna.size + (st.food - 50) * 0.5);
}
function fmtAge(h) {
  if (h < 1) return 'Just hatched';
  if (h < 24) return Math.floor(h) + ' h';
  return Math.floor(h / 24) + ' d ' + Math.floor(h % 24) + ' h';
}

/* ---------- saving: your account first, this browser as a fallback ---------- */
const LS_KEY = 'pocket-pet-v1';
const Store = {
  mode: 'none', ref: null, writing: false, again: false, dirty: false, timer: 0, off: false, retried: false, localOk: false,
  init() {
    try { localStorage.setItem(LS_KEY + '-t', '1'); localStorage.removeItem(LS_KEY + '-t'); this.localOk = true; this.mode = 'local'; }
    catch (e) { this.localOk = false; }
  },
  readLocal() {
    if (!this.localOk) return null;
    try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  },
  writeLocal(o) { if (!this.localOk) return; try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {} },
  clearLocal() { if (!this.localOk) return; try { localStorage.removeItem(LS_KEY); } catch (e) {} },
  async connect() {
    try {
      const c = window.claude;
      if (!c || typeof c.use !== 'function') return null;
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      if (!db || !user) return null;
      const uid = await user.id();
      if (!uid) return null;
      const ref = db.collection('data/users/' + uid).doc('pet');
      const snap = await ref.get();
      this.ref = ref;
      this.mode = 'account';
      return { remote: snap && snap.exists ? snap.data() : null };
    } catch (e) { return null; }
  },
  touch() {
    this.dirty = true;
    if (!this.ref || this.off) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 3000);
  },
  async flush() {
    clearTimeout(this.timer);
    if (!this.ref || this.off || !this.dirty || !st) return;
    if (this.writing) { this.again = true; return; }
    this.writing = true; this.dirty = false;
    try { await this.ref.set(serialize()); this.retried = false; }
    catch (e) {
      const code = e && e.code;
      if (code === 'unavailable' && !this.retried) { this.retried = true; this.dirty = true; setTimeout(() => this.flush(), 1200 + Math.random() * 1500); }
      else if (code === 'unavailable') { this.dirty = true; }
      else { this.off = true; this.mode = this.localOk ? 'local' : 'none'; }
    } finally {
      this.writing = false;
      if (this.again) { this.again = false; this.dirty = true; this.flush(); }
    }
  },
  async remove() {
    clearTimeout(this.timer); this.dirty = false; this.clearLocal();
    if (this.ref && !this.off) { try { await this.ref.delete(); } catch (e) {} }
  },
};
let localSaveAt = 0;
function saveLocalNow() { if (st) { Store.writeLocal(serialize()); localSaveAt = Date.now(); } }
function saveSoon() {
  if (!st) return;
  if (Date.now() - localSaveAt > 1000) saveLocalNow();
  Store.touch();
}
function saveNoteText() {
  if (Store.mode === 'account' && !Store.off) return 'Saved to your account. Open this page on another device and the same pet is there.';
  if (Store.localOk) return 'Saved in this browser only.';
  return 'Not saved in this view. The pet resets when you close it.';
}
