/* ---------- Dungeon abilities: every pet has its own Normal attack, Strong attack and Ult.
   Ability cards (from gift boxes and boss chests) can be equipped into any of those three slots. ---------- */
const CARD_R = {
  common: { name: 'Common', c: '#A9B8CB', d: '#5A6A80', mult: 1, dupe: 40 },
  rare: { name: 'Rare', c: '#5DA8F0', d: '#1F5BA8', mult: 1.12, dupe: 100 },
  epic: { name: 'Epic', c: '#B983F5', d: '#5B2EA6', mult: 1.25, dupe: 250 },
  legend: { name: 'Legendary', c: '#FFC93C', d: '#A2680A', mult: 1.42, dupe: 600 },
};
const R_ORDER = ['common', 'rare', 'epic', 'legend'];
/* deck slots. Evolving opens a second Strong slot at Adept (stage 4); at Guardian (stage 5) both Strong attacks
   turn into their stronger forms, and at Celestial (stage 7) the Ult itself is upgraded to its ultimate form */
const SLOTS = ['normal', 'strong', 'strong2', 'ult'];
const STRONG_TIER_STAGE = 5;
const slotType = s => (s && s.indexOf('strong') === 0 ? 'strong' : s);
const strongSlots = stage => (stage >= 4 ? 2 : 1);
const slotOpen = (s, stage) => s === 'strong2' ? stage >= 4 : true;
const kitSlots = p => SLOTS.filter(s => slotOpen(s, (p && p.stage) || 1));
const ULT_TIER_STAGE = 7;
const SLOT_INFO = {
  normal: { name: 'Normal attack', short: 'Normal', note: 'Tap anywhere to fire it and move that way. Free to use, and every hit earns MP.' },
  strong: { name: 'Strong attack', short: 'Strong', note: 'Tap the button to use it. Costs MP. At Guardian it becomes its stronger form.' },
  strong2: { name: 'Second strong attack', short: 'Strong 2', note: 'Unlocked at Adept. A second Strong attack with its own button and cooldown. At Guardian it becomes its stronger form.', unlock: 'Adept' },
  ult: { name: 'Ultimate', short: 'Ult', note: 'Your biggest move. Tap when it glows. Costs lots of MP. At Celestial it becomes its ultimate form.' },
};
/* the ultimate form of every Ult, unlocked at Celestial */
const ULT_PLUS = { u_nova: 'Supernova Blast', u_shield: 'Crystal Citadel', u_meteor: 'Starfall', u_clone: 'Mirror Legion', u_warp: 'Chrono Rift', u_beam: 'Giga Beam', u_swarm: 'Galaxy Swarm',
  megabeam: 'Giga Beam', starswarm: 'Galaxy Swarm', blossom: 'Sakura Tempest', meteorstorm: 'Armageddon', clones: 'Shadow Legion', blizzard: 'Absolute Zero', timestop: 'World Freeze', dragon: 'Twin Dragon Spirits', supernova: 'Hypernova', phoenix: 'Eternal Phoenix' };
const CARDS = {
  // normal attacks
  firedart: { slot: 'normal', r: 'common', el: 'fire', name: 'Fire Darts', glyph: 'flame', desc: 'A rapid stream of fiery darts.' },
  icicle: { slot: 'normal', r: 'common', el: 'frost', name: 'Icicle Needles', glyph: 'snow', desc: 'Needles that pierce a whole line of monsters.' },
  leafblade: { slot: 'normal', r: 'common', el: 'leaf', name: 'Leaf Blades', glyph: 'leaf', desc: 'Spinning leaves that curve toward monsters.' },
  sparkzap: { slot: 'normal', r: 'rare', el: 'spark', name: 'Spark Zap', glyph: 'bolt', desc: 'Lightning that jumps to two more monsters.' },
  bubblebomb: { slot: 'normal', r: 'rare', el: 'bubble', name: 'Bubble Bombs', glyph: 'bubbles', desc: 'Bouncy bubbles that pop in a splash.' },
  shadowclaw: { slot: 'normal', r: 'rare', el: 'shadow', name: 'Shadow Claws', glyph: 'claw', desc: 'Huge claw swipes that hit everything in front.' },
  prismlaser: { slot: 'normal', r: 'epic', el: 'prism', name: 'Prism Lasers', glyph: 'beam', desc: 'Rainbow lasers that bounce off the walls.' },
  starboom: { slot: 'normal', r: 'epic', el: 'gold', name: 'Star Boomerangs', glyph: 'stars', desc: 'Three giant stars that fly out and come back.' },
  comet: { slot: 'normal', r: 'legend', el: 'cosmic', name: 'Comet Cannon', glyph: 'meteor', desc: 'Comets that explode and leave the ground burning.' },
  // strong attacks
  fireball: { slot: 'strong', r: 'common', el: 'fire', name: 'Fireball', glyph: 'flame', cost: 20, cd: 1.6, desc: 'A big fireball that explodes in a blast.' },
  pounce: { slot: 'strong', r: 'common', el: 'gold', name: 'Pounce', glyph: 'dash', cost: 16, cd: 1.4, desc: 'Leap forward and land with a shockwave. Nothing can hurt you mid-leap.' },
  whirl: { slot: 'strong', r: 'common', el: 'bubble', name: 'Whirlwind', glyph: 'spin', cost: 22, cd: 2.2, desc: 'Spin for a moment, hitting everything around you.' },
  frostnova: { slot: 'strong', r: 'rare', el: 'frost', name: 'Frost Nova', glyph: 'nova', cost: 26, cd: 3.4, desc: 'An icy blast that freezes monsters around you.' },
  chain: { slot: 'strong', r: 'rare', el: 'spark', name: 'Chain Lightning', glyph: 'bolt', cost: 22, cd: 2, desc: 'A bolt that bounces between six monsters.' },
  thorns: { slot: 'strong', r: 'rare', el: 'leaf', name: 'Thorn Line', glyph: 'thorns', cost: 20, cd: 2.2, desc: 'Giant thorns burst up in a line and poison monsters.' },
  meteor: { slot: 'strong', r: 'epic', el: 'fire', name: 'Meteor Drop', glyph: 'meteor', cost: 34, cd: 3.8, desc: 'A huge meteor smashes down and leaves a burning crater.' },
  blackhole: { slot: 'strong', r: 'epic', el: 'cosmic', name: 'Black Hole', glyph: 'vortex', cost: 36, cd: 5, desc: 'A vortex sucks monsters in and crushes them.' },
  thunder: { slot: 'strong', r: 'legend', el: 'spark', name: 'Thunder God', glyph: 'hammer', cost: 40, cd: 3.8, desc: 'Slam the ground and call lightning down all around you.' },
  // ultimates
  megabeam: { slot: 'ult', r: 'common', el: 'gold', name: 'Mega Beam', glyph: 'beam', cost: 60, cd: 12, desc: 'A giant beam burns everything in its path.' },
  starswarm: { slot: 'ult', r: 'common', el: 'spark', name: 'Star Swarm', glyph: 'stars', cost: 55, cd: 11, desc: 'Thirty homing stars burst out at once.' },
  blossom: { slot: 'ult', r: 'common', el: 'leaf', name: 'Blossom Storm', glyph: 'flower', cost: 60, cd: 14, desc: 'A storm of petals heals you and slices monsters.' },
  meteorstorm: { slot: 'ult', r: 'rare', el: 'fire', name: 'Meteor Storm', glyph: 'meteor', cost: 70, cd: 14, desc: 'Meteors rain down across the whole room.' },
  clones: { slot: 'ult', r: 'rare', el: 'shadow', name: 'Shadow Army', glyph: 'twin', cost: 70, cd: 16, desc: 'Three shadow copies of you join the fight.' },
  blizzard: { slot: 'ult', r: 'rare', el: 'frost', name: 'Blizzard', glyph: 'snow', cost: 65, cd: 14, desc: 'A freezing storm hits and slows every monster in sight.' },
  timestop: { slot: 'ult', r: 'epic', el: 'cosmic', name: 'Time Stop', glyph: 'hourglass', cost: 80, cd: 18, desc: 'Every monster freezes, and your hits do double damage.' },
  dragon: { slot: 'ult', r: 'epic', el: 'fire', name: 'Dragon Spirit', glyph: 'dragon', cost: 80, cd: 16, desc: 'A spirit dragon swoops through the room breathing fire.' },
  supernova: { slot: 'ult', r: 'legend', el: 'prism', name: 'Supernova', glyph: 'nova', cost: 100, cd: 20, desc: 'Become a star and explode, hitting everything on screen.' },
  phoenix: { slot: 'ult', r: 'legend', el: 'fire', name: 'Phoenix Form', glyph: 'feather', cost: 90, cd: 22, desc: 'Turn into a blazing phoenix. Nothing can hurt you and you burn all you touch.' },
};
const CARD_IDS = Object.keys(CARDS);
const CARDS_BY_R = {};
R_ORDER.forEach(r => { CARDS_BY_R[r] = CARD_IDS.filter(id => CARDS[id].r === r); });
const CARD_MAX_LV = 5;
const NORMAL_GLYPH = { twin: 'twinshot', spread: 'fan', lance: 'lance', volley: 'volley', seeker: 'orb', wave: 'wave', burst: 'burst', chain: 'bolt', orbit: 'orbit', bouncer: 'bubbles', boomerang: 'boom', shard: 'gem' };
const INNATE_STRONG = {
  rush: { cost: 16, cd: 1.5, glyph: 'horn' }, gust: { cost: 18, cd: 1.6, glyph: 'crescent' }, whip: { cost: 22, cd: 2.2, glyph: 'spin' },
  fury: { cost: 18, cd: 1.6, glyph: 'claw' }, eyebeam: { cost: 24, cd: 2.4, glyph: 'eye' }, slam: { cost: 24, cd: 2.4, glyph: 'slam' },
  orbs: { cost: 22, cd: 2.2, glyph: 'orbit' }, burst: { cost: 20, cd: 1.8, glyph: 'nova' }, spikes: { cost: 22, cd: 2.2, glyph: 'thorns' },
};
const INNATE_ULT = {
  nova: { cost: 70, cd: 13, glyph: 'nova', name: 'Nova Blast', desc: 'A colossal blast hits every monster nearby.' },
  shield: { cost: 60, cd: 14, glyph: 'shield', name: 'Bubble Fortress', desc: 'Nothing can hurt you for 6 seconds, and bubbles burst out at monsters.' },
  meteor: { cost: 70, cd: 14, glyph: 'meteor', name: 'Meteor Rain', desc: 'Meteors rain down on every monster nearby.' },
  clone: { cost: 70, cd: 15, glyph: 'twin', name: 'Mirror Twins', desc: 'Two copies of you fight alongside for 9 seconds.' },
  warp: { cost: 65, cd: 15, glyph: 'hourglass', name: 'Time Warp', desc: 'Monsters slow to a crawl and you attack twice as fast.' },
  beam: { cost: 65, cd: 12, glyph: 'beam', name: 'Mega Beam', desc: 'A giant beam burns everything in its path for 3 seconds.' },
  swarm: { cost: 60, cd: 11, glyph: 'stars', name: 'Star Swarm', desc: 'Thirty homing stars burst out at once.' },
};

/* ---------- a pet's level, health and magic ---------- */
const dunXpNeed = L => 40 + 25 * L + 2 * L * L, DLV_MAX = 200;
function petCombat(p) {
  const L = p.dlv || 1, stage = p.stage || 1;
  const sm = 1 + 0.22 * (stage - 1);   // evolving makes every ability stronger
  const f = formOf(p), AB = applyAbOv(petAbility(f, p.dna.seed), p);
  const dna = clamp(AB.power - 0.18 * (stage - 1), 0.95, 1.15);
  // regen is the MP earned per hit of the normal attack (HP and MP never refill on their own). Accessories add to all four
  const A = accStats(p), base = { hp: Math.round(80 + 12 * L + 25 * (stage - 1)), mp: Math.round(60 + 6 * L + 10 * (stage - 1)), regen: r1(1 + 0.03 * L), atk: r1((8 + 1.6 * L) * sm * dna) };
  return { L, stage, sm, hp: Math.round(base.hp * (1 + (A.hp || 0))), mp: Math.round(base.mp * (1 + (A.mp || 0))), regen: r1(base.regen * (1 + (A.regen || 0))), atk: r1(base.atk * (1 + (A.atk || 0))), need: dunXpNeed(L), base, acc: A };
}
/* one ability, ready for the Tower: own ones come from the pet's body, cards from the collection */
/* the extra Strong attacks a pet learns on its own: two more of its kind, chosen from its seed */
function extraStrongs(AB, p) {
  const R = mulberry32(((p.dna && p.dna.seed) || 7) * 2654435761 >>> 0), keys = Object.keys(INNATE_STRONG).filter(k => k !== AB.strong);
  for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, 2);
}
function innateAbility(slot, AB, p) {
  const E = ELEMENTS[AB.el], grow = 1 + 0.05 * ((p.stage || 1) - 1);
  if (slot === 'strong2' || slot === 'strong3') { const k = extraStrongs(AB, p)[slot === 'strong2' ? 0 : 1], S = INNATE_STRONG[k]; return { slot, own: true, key: 's_' + k, name: k === 'spikes' ? espikeName(AB.el) : `${E.name} ${STRONGS[k].name}`, glyph: S.glyph, el: AB.el, mult: grow, cost: S.cost, cd: S.cd, desc: k === 'spikes' ? espikeDesc(AB.el) : STRONGS[k].desc }; }
  if (slot === 'normal') return { slot, own: true, key: 'n_' + AB.shot, name: AB.name, glyph: NORMAL_GLYPH[AB.shot] || 'orb', el: AB.el, mult: grow, cost: 0, cd: 0, desc: AB.shotDesc.replace('the sky', 'the room').replace('the edges', 'the walls').replace('the ship', 'you') };
  if (slot === 'strong' && AB.starStrong) { const T = AB.starStrong, S = STAR_POOLS[T.tier].strong[T.key]; return { slot, own: true, star: T.tier, key: 'x_' + T.key, name: S.name, glyph: S.glyph, el: AB.el, mult: grow * (T.tier >= 6 ? 1.5 : T.tier >= 5 ? 1.25 : 1.1), cost: S.cost, cd: S.cd, desc: S.desc }; }
  if (slot === 'ult' && AB.starUlt) { const T = AB.starUlt, U = STAR_POOLS[T.tier].ult[T.key]; return { slot, own: true, star: T.tier, key: 'y_' + T.key, name: U.name, glyph: U.glyph, el: AB.el, mult: grow * (T.tier >= 6 ? 1.5 : T.tier >= 5 ? 1.25 : 1.1), cost: U.cost, cd: U.cd, desc: U.desc }; }
  if (slot === 'strong') { const S = INNATE_STRONG[AB.strong]; return { slot, own: true, key: 's_' + AB.strong, name: AB.strongName, glyph: S.glyph, el: AB.el, mult: grow, cost: S.cost, cd: S.cd, desc: AB.strongDesc }; }
  const U = INNATE_ULT[AB.special];
  return { slot, own: true, key: 'u_' + AB.special, name: `${E.name} ${U.name}`, glyph: U.glyph, el: AB.el, mult: grow, cost: U.cost, cd: U.cd, desc: U.desc };
}
function cardAbility(id, lv) {
  const C = CARDS[id], R = CARD_R[C.r];
  lv = clamp(lv || 1, 1, CARD_MAX_LV);
  return { slot: C.slot, own: false, card: id, lv, r: C.r, key: id, name: C.name, glyph: C.glyph, el: C.el, mult: R.mult * (1 + 0.15 * (lv - 1)), cost: C.cost || 0, cd: (C.cd || 0) * (1 - 0.05 * (lv - 1)), desc: C.desc };
}
/* does this deck entry fit this slot: a card of the slot's kind, or an elemental move of it (one the pet may use, when the pet is given) */
function deckFits(id, s, p) {
  if (typeof id !== 'string') return false;
  if (CARDS[id]) return CARDS[id].slot === slotType(s);
  const mv = elemParse(id); return !!mv && mv.slot === slotType(s) && (!p || !elemLock(mv, p));
}
function cleanDeck(d, p) {
  const out = {}, used = new Set();
  SLOTS.forEach(s => { out[s] = null; });
  if (d && typeof d === 'object') SLOTS.forEach(s => { const id = d[s]; if (deckFits(id, s, p) && !used.has(id)) { out[s] = id; used.add(id); } });
  return out;
}
/* the Celestial upgrade: same Ult, a new name, more power and a bigger show */
function tierUlt(a) {
  const nm = ULT_PLUS[a.key];
  return Object.assign({}, a, { tier: 2, name: nm ? (a.own ? `${ELEMENTS[a.el].name} ${nm}` : nm) : a.name + ' Ω', baseName: a.name, mult: a.mult * 1.6, desc: a.desc + ' Celestial form: bigger, longer and much stronger.' });
}
/* the Guardian upgrade: the same Strong attack, a new name and far more power */
function tierStrong(a) { return Object.assign({}, a, { tier: 2, name: a.name + ' +', baseName: a.name, mult: a.mult * 1.6, cd: a.cd * 0.85, desc: a.desc + ' Guardian form: much stronger, and quicker to come back.' }); }
function petKit(p) {
  const AB = applyAbOv(petAbility(formOf(p), p.dna.seed), p), deck = cleanDeck(p.deck, p), kit = {};
  kitSlots(p).forEach(s => {
    const id = deck[s], mv = elemParse(id);
    let a = mv ? elemAbility(mv, s, p) : id && st && st.cards && st.cards[id] ? cardAbility(id, st.cards[id]) : innateAbility(s, AB, p);
    if (id && a.slot !== s) a = Object.assign({}, a, { slot: s });
    // two Strong slots never hold the same attack
    if (s !== 'strong' && slotType(s) === 'strong' && kitSlots(p).some(o => o !== s && slotType(o) === 'strong' && kit[o] && kit[o].key === a.key)) a = innateAbility(s, AB, p);
    if (s === 'ult' && (p.stage || 1) >= ULT_TIER_STAGE) a = tierUlt(a);
    if (slotType(s) === 'strong' && (p.stage || 1) >= STRONG_TIER_STAGE) a = tierStrong(a);
    kit[s] = a;
  });
  // a card in slot 1 might match the innate extra: swap the extra for the other one
  ['strong2'].forEach(s => { if (!kit[s] || !kit[s].own) return; const clash = kitSlots(p).some(o => o !== s && slotType(o) === 'strong' && kit[o] && kit[o].key === kit[s].key); if (clash) { const alt = innateAbility('strong3', AB, p); if (!kitSlots(p).some(o => kit[o] && kit[o].key === alt.key)) kit[s] = Object.assign((p.stage || 1) >= STRONG_TIER_STAGE ? tierStrong(alt) : alt, { slot: s }); } });
  return { AB, kit, stats: petCombat(p) };
}

/* ---------- the gift box: 3 ability cards, 3 gemstones, a bundle, an energy drink and a bond treat ---------- */
const GIFT_PRICE = '$10.00', GIFT_PEARLS = 500, GIFT_PITY = 10, GIFT_CRYSTALS = 1000;
const CARD_ODDS = [['common', 60], ['rare', 28], ['epic', 10], ['legend', 2]];
const CARD_ODDS_RARE = [['rare', 75], ['epic', 20], ['legend', 5]];
const GIFT_GEMS = [['quartz', 26], ['amethyst', 22], ['citrine', 18], ['emerald', 15], ['sapphire', 12], ['starstone', 7]];
const DRINKS = { soda: { name: 'Star soda', energy: 40 }, tea: { name: 'Comet tea', energy: 100 } };
function wkeyR(rng, list) { let tot = 0; list.forEach(p => { tot += p[1]; }); let r = rng() * tot; for (const p of list) { r -= p[1]; if (r < 0) return p[0]; } return list[list.length - 1][0]; }
const rollCardId = (rng, r) => { const ids = CARDS_BY_R[r]; return ids[Math.floor(rng() * ids.length) % ids.length]; };
/* pure: what one box holds. pity = boxes opened since the last Legendary card */
function rollGiftBox(rng, pity) {
  const rs = [wkeyR(rng, CARD_ODDS), wkeyR(rng, CARD_ODDS), wkeyR(rng, CARD_ODDS_RARE)];
  let legend = rs.includes('legend');
  if (!legend && pity >= GIFT_PITY - 1) { rs[2] = 'legend'; legend = true; }
  const cards = rs.map(r => rollCardId(rng, r));
  const gems = [0, 1, 2].map(() => wkeyR(rng, GIFT_GEMS));
  const b = rng();
  let bundle;
  if (b < 0.5) bundle = { kind: 'coins', n: 300 + 50 * Math.floor(rng() * 9) };
  else if (b < 0.75) bundle = { kind: 'pearls', n: 20 + 5 * Math.floor(rng() * 7) };
  else { const crop = wkeyR(rng, [['sunberry', 35], ['carrot', 30], ['pumpkin', 22], ['starfruit', 13]]); bundle = { kind: 'food', crop, n: { sunberry: 8, carrot: 6, pumpkin: 4, starfruit: 2 }[crop] }; }
  const drink = rng() < 0.7 ? 'soda' : 'tea';
  // and a jar of Ambrosia in every third box or so: a third of a pet level for whichever pet eats it
  const ambrosia = rng() < 0.35 ? 1 : 0;
  // every box has a bond treat (a heart tart, two bond levels, or now and then a kindred sundae, three), and some a
  // level food: moon honeycomb (half a pet level), or rarely a grand feast (twenty pet levels)
  const treat = rng() < 0.72 ? 'hearttart' : 'sundae', lr = rng(), lvFood = lr < 0.05 ? 'feast' : lr < 0.3 ? 'honeycomb' : null;
  return { cards, gems, bundle, drink, ambrosia, treat, lvFood, crystals: GIFT_CRYSTALS, pity: legend ? 0 : pity + 1 };
}
/* give a card to the household: new, a level up, or coins when it is already maxed */
function grantCard(id) {
  const had = st.cards[id] || 0;
  if (!had) { st.cards[id] = 1; return { id, isNew: true, lv: 1 }; }
  if (had < CARD_MAX_LV) { st.cards[id] = had + 1; return { id, up: true, lv: had + 1 }; }
  const coins = CARD_R[CARDS[id].r].dupe; st.coins += coins;
  return { id, maxed: true, lv: had, coins };
}
function applyGiftBox(roll) {
  const out = [];
  if (roll.crystals) { st.crystals = (st.crystals || 0) + roll.crystals; out.push({ kind: 'crystals', n: roll.crystals }); }
  roll.cards.forEach(id => out.push(Object.assign({ kind: 'card' }, grantCard(id))));
  roll.gems.forEach(g => { st.gems[g] = Math.min(99, (st.gems[g] || 0) + 1); out.push({ kind: 'gem', gem: g }); });
  const b = roll.bundle;
  if (b.kind === 'coins') st.coins += b.n;
  else if (b.kind === 'pearls') st.pearls += b.n;
  else st.pantry[b.crop] = Math.min(999, (st.pantry[b.crop] || 0) + b.n);
  out.push(Object.assign({}, b));
  st.pantry[roll.drink] = Math.min(999, (st.pantry[roll.drink] || 0) + 1);
  out.push({ kind: 'drink', id: roll.drink });
  if (roll.ambrosia) { st.pantry.ambrosia = Math.min(999, (st.pantry.ambrosia || 0) + roll.ambrosia); out.push({ kind: 'food', crop: 'ambrosia', n: roll.ambrosia }); }
  [roll.treat, roll.lvFood].forEach(k => { if (!k || !SNACKS[k]) return; st.pantry[k] = Math.min(999, (st.pantry[k] || 0) + 1); out.push({ kind: 'food', crop: k, n: 1 }); });
  st.dun.pity = roll.pity; st.dun.boxes = (st.dun.boxes || 0) + 1;
  return out;
}

/* ---------- glyphs: one tiny picture per ability, drawn in cards (SVG) and on game buttons (canvas) ---------- */
const gStar = (cx, cy, r, n, ri) => { let d = ''; n = n || 5; ri = ri || r * 0.45; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? ri : r; d += (i ? 'L' : 'M') + r1(cx + Math.cos(a) * rr) + ' ' + r1(cy + Math.sin(a) * rr); } return d + 'Z'; };
const gCirc = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const GLYPHS = {
  flame: [['f', 'M12 2.5c.9 3.7 5.6 5.7 5.6 11.1a5.6 5.6 0 0 1-11.2 0c0-2.7 1.5-4.6 2.9-5.7-.1 1.9.8 3.2 2 3.5-.5-3 .1-6.1.7-8.9z']],
  snow: [['s', 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6 12 7l2.4-2.4M9.6 19.4 12 17l2.4 2.4']],
  leaf: [['f', 'M5 19C5 10 10 4.5 20 4c.5 10-5 15.5-15 15z'], ['d', 'M6.5 17.5 15 9']],
  bolt: [['f', 'M13.5 2 5 13.5h6l-1.2 8.5 9.2-12h-6.5z']],
  bubbles: [['f', gCirc(9, 9.5, 5.2)], ['f', gCirc(16.5, 16, 3.6)], ['f', gCirc(17.6, 5.8, 2.1)]],
  claw: [['s', 'M6 4c4 4 5 9 3.5 16M11.5 3c4 4 5 9.5 3.5 17M17 4c3 3 4 7.5 3 13']],
  beam: [['f', 'M2.5 9.5h11l2.5-4 6 6.5-6 6.5-2.5-4h-11z']],
  stars: [['f', gStar(8.5, 9.5, 6)], ['f', gStar(17, 16, 4.6)], ['f', gStar(17.5, 5, 2.6)]],
  meteor: [['s', 'M3 21l7-7M6.5 21.5l4.5-4.5M2.5 17.5l4.5-4.5'], ['f', gCirc(15, 9, 5)]],
  dash: [['s', 'M3 8h5M2 12h6.5M3 16h5'], ['f', 'M10.5 5l10 7-10 7z']],
  spin: [['s', 'M12 4.5a7.5 7.5 0 1 1-7.1 5.1M3.4 6.2l1.5 3.6 3.6-1.4']],
  nova: [['f', gStar(12, 12, 10.5, 8, 4.4)]],
  thorns: [['f', 'M2.5 21l3.2-10 3.2 10zM8.8 21l3.2-16 3.2 16zM15.1 21l3.2-11 3.2 11z']],
  vortex: [['s', 'M12 12.5a1.5 1.5 0 0 1 1.5-1.5 3 3 0 0 1 3 3 4.5 4.5 0 0 1-4.5 4.5 6 6 0 0 1-6-6 7.5 7.5 0 0 1 7.5-7.5']],
  hammer: [['f', 'M3.5 4h12v6.5h-12z'], ['f', 'M8 10.5h3v10.5H8z'], ['f', 'M19 6l2.5 3.5h-2l1 4-3-4.5h2z']],
  flower: [['f', gCirc(12, 6.3, 3.6)], ['f', gCirc(17.4, 10.2, 3.6)], ['f', gCirc(15.4, 16.6, 3.6)], ['f', gCirc(8.6, 16.6, 3.6)], ['f', gCirc(6.6, 10.2, 3.6)], ['d', gCirc(12, 11.8, 2.4)]],
  twin: [['f', 'M8.5 20.5c-3.5 0-5-2.6-5-6.2S5.5 7.6 8.5 7.6s5 3.1 5 6.7-1.5 6.2-5 6.2z'], ['f', 'M16 19.5c-3 0-4.3-2.2-4.3-5.2S13.5 8.5 16 8.5s4.3 2.8 4.3 5.8-1.3 5.2-4.3 5.2z'], ['d', 'M7 13v1.2M10 13v1.2M14.7 13v1M17.3 13v1']],
  hourglass: [['f', 'M6 3h12v2.5l-4.5 6.5 4.5 6.5V21H6v-2.5l4.5-6.5L6 5.5z'], ['d', 'M9 18.6h6']],
  dragon: [['f', 'M2.5 13.5C5 7.5 10.5 5 16 5.8l3.4-3 .4 4.6c1.6 1.2 2.2 2.8 1.7 4.4l-4.2 1.4-2.2 5.3-3-2.1-3.1 3.2-1-4.2z'], ['d', 'M15.8 9.2v.2']],
  feather: [['f', 'M20 3C11 4 6 9 5 18l-1.5 3 1.2.6L6.5 18c3-.5 6-2 8-4.5L11 13l5-1.5C18 9 19.5 6 20 3z']],
  twinshot: [['f', 'M8.5 2.5a1.6 1.6 0 0 1 1.6 1.6V16H6.9V4.1a1.6 1.6 0 0 1 1.6-1.6zM15.5 2.5a1.6 1.6 0 0 1 1.6 1.6V16h-3.2V4.1a1.6 1.6 0 0 1 1.6-1.6z'], ['s', 'M8.5 19.5v2M15.5 19.5v2']],
  fan: [['f', 'M12 2.5l1.8 8h-3.6zM4.2 6.2l4.6 6-2.6 1.8zM19.8 6.2l-2 7.8-2.6-1.8z'], ['f', gCirc(12, 18.2, 3)]],
  lance: [['f', 'M12 1.8l2.4 8.6V22h-4.8V10.4z']],
  volley: [['f', gCirc(5.5, 13, 3)], ['f', gCirc(12, 8, 3)], ['f', gCirc(18.5, 13, 3)], ['s', 'M5.5 18.5v2.5M12 13.5v4M18.5 18.5v2.5']],
  orb: [['f', gCirc(12, 13, 6)], ['s', 'M4.5 7a10 10 0 0 1 15 0']],
  wave: [['s', 'M3 8c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0']],
  burst: [['f', gStar(12, 12, 10, 6, 4)]],
  orbit: [['s', 'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0'], ['f', gCirc(12, 12, 3.2)], ['f', gCirc(20, 12, 2.7)], ['f', gCirc(4, 12, 2.7)]],
  boom: [['f', 'M3.5 5.5C7 3 10 4 11 8c.6 2.2 2.7 3.5 5 3.4 3-.2 5 1 4.5 4-4 1.5-9 .5-12-2.5S3 8.6 3.5 5.5z']],
  gem: [['f', 'M12 21 3 9.5 7 4h10l4 5.5z'], ['d', 'M3.4 9.5h17.2M9 4.4l3 16 3-16']],
  horn: [['f', 'M5 21c0-8.5 4-14.5 14.5-18-3 5-4 10.5-3 18z']],
  crescent: [['f', 'M19 3.5A10 10 0 1 0 19 20.5 8 8 0 1 1 19 3.5z']],
  eye: [['f', 'M2 12c3-5 7-7.2 10-7.2S19 7 22 12c-3 5-7 7.2-10 7.2S5 17 2 12z'], ['d', gCirc(12, 12, 3)]],
  slam: [['s', 'M2.5 21h19M4 17l-2-2M20 17l2-2'], ['f', gCirc(12, 10, 5.5)]],
  shield: [['f', 'M12 2.8l7.5 3.2v5.2c0 5.2-3.7 8.8-7.5 10.2-3.8-1.4-7.5-5-7.5-10.2V6z']],
};
function glyphSVG(id) {
  const parts = GLYPHS[id] || GLYPHS.orb;
  return `<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">${parts.map(([m, d]) => m === 'f' ? `<path d="${d}" fill="#FFFDF8" stroke="#2B2433" stroke-width="1.5" stroke-linejoin="round"/>` : m === 's' ? `<path d="${d}" fill="none" stroke="#2B2433" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="${d}" fill="none" stroke="#2B2433" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
}
const glyphPaths = {};
function drawGlyph(c, id, x, y, size, alpha) {
  const parts = GLYPHS[id] || GLYPHS.orb;
  if (!glyphPaths[id]) glyphPaths[id] = parts.map(([m, d]) => [m, new Path2D(d)]);
  const k = size / 24;
  c.save(); c.translate(x - size / 2, y - size / 2); c.scale(k, k);
  if (alpha != null) c.globalAlpha = alpha;
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [m, p] of glyphPaths[id]) {
    if (m === 'f') { c.fillStyle = '#FFFDF8'; c.fill(p); c.lineWidth = 1.5; c.strokeStyle = '#2B2433'; c.stroke(p); }
    else if (m === 's') { c.lineWidth = 4.6; c.strokeStyle = '#2B2433'; c.stroke(p); c.lineWidth = 2.4; c.strokeStyle = '#FFFDF8'; c.stroke(p); }
    else { c.lineWidth = 1.7; c.strokeStyle = '#2B2433'; c.stroke(p); }
  }
  c.restore();
}
/* a card tile. a = an ability from cardAbility()/innateAbility(); o = { locked, equipped, isNew, up, big } */
function abilityCardHTML(a, o) {
  o = o || {};
  const E = ELEMENTS[a.el] || ELEMENTS.spark, R = a.own ? null : CARD_R[a.r];
  const cls = ['acard', a.own ? 'own' : 'r-' + a.r, o.locked ? 'locked' : '', o.equipped ? 'eq' : '', o.big ? 'big' : ''].filter(Boolean).join(' ');
  const tag = o.isNew ? '<span class="ac-new">New!</span>' : o.up ? `<span class="ac-new up">Lv ${a.lv}!</span>` : o.maxed ? '<span class="ac-new up">Max</span>' : '';
  return `<span class="${cls}" style="--ec:${E.color};--ed:${E.dark}${R ? `;--rc:${R.c};--rd:${R.d}` : ''}">${tag}${a.tier ? '<span class="ac-tier">Celestial</span>' : ''}<span class="ac-top"><span>${(SLOT_INFO[a.slot] || SLOT_INFO[slotType(a.slot)]).short}</span>${a.own ? (o.big ? '<span>Own</span>' : '') : o.locked ? '' : `<span>Lv ${a.lv}</span>`}</span><span class="ac-art">${o.locked ? '<b class="ac-q">?</b>' : glyphSVG(a.glyph)}</span><b class="ac-name">${o.locked ? '???' : esc(a.name)}</b><small class="ac-r">${a.own ? 'Pet ability' : R.name}</small>${a.own ? '' : starsHTML(CARD_STARS[a.r] || 3, 'ac-stars')}</span>`;
}
