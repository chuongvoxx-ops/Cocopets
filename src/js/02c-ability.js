/* ---------- space abilities: every pet's shot is built from its own body ----------
   element  <- coat colour        shot pattern <- wings, horns, eyes, tail, arms, fur, orbs
   special  <- aura, halo, armour, wings, horns, personality      numbers <- DNA and evolution stage */
const ELEMENTS = {
  fire: { name: 'Ember', color: '#FF7A3D', core: '#FFE08A', dark: '#C2410C' },
  frost: { name: 'Frost', color: '#7FD3F2', core: '#FFFFFF', dark: '#2F80B7' },
  leaf: { name: 'Bloom', color: '#6CC15A', core: '#E8FFC2', dark: '#2E7D32' },
  spark: { name: 'Spark', color: '#FFD447', core: '#FFFFFF', dark: '#B7860B' },
  cosmic: { name: 'Cosmic', color: '#B07CF0', core: '#F2E6FF', dark: '#5B2A9E' },
  bubble: { name: 'Bubble', color: '#8FE3F0', core: '#FFFFFF', dark: '#2B9CB0' },
  candy: { name: 'Sugar', color: '#FF8FB8', core: '#FFFFFF', dark: '#C2185B' },
  shadow: { name: 'Shadow', color: '#9C88D6', core: '#EDE6FF', dark: '#3B2F63' },
  gold: { name: 'Golden', color: '#F2C94C', core: '#FFFBE0', dark: '#9A7414' },
  prism: { name: 'Prism', color: '#FF9BD2', core: '#FFFFFF', dark: '#7B61D9', rainbow: true },
};
/* the eight elements every pet belongs to (its coat decides which): these drive the elemental reactions in the Tower */
const E8 = {
  wind: { name: 'Wind', color: '#8FE8C8', dark: '#2E8C78', glyph: 'wind', mark: 'Swirl' },
  fire: { name: 'Fire', color: '#FF7A3D', dark: '#C2410C', glyph: 'fire', mark: 'Burning' },
  ice: { name: 'Ice', color: '#7FD3F2', dark: '#2F80B7', glyph: 'ice', mark: 'Chilled' },
  water: { name: 'Water', color: '#4FA8F0', dark: '#1F5FA8', glyph: 'water', mark: 'Wet' },
  thunder: { name: 'Thunder', color: '#FFD447', dark: '#B7860B', glyph: 'thunder', mark: 'Charged' },
  earth: { name: 'Earth', color: '#D4A054', dark: '#7A5218', glyph: 'earth', mark: 'Crusted' },
  dark: { name: 'Dark', color: '#9C88D6', dark: '#3B2F63', glyph: 'dark', mark: 'Cursed' },
  light: { name: 'Light', color: '#FFF0A0', dark: '#B89A30', glyph: 'light', mark: 'Blessed' },
};
const E8_ORDER = ['wind', 'fire', 'ice', 'water', 'thunder', 'earth', 'dark', 'light'];
const E8_OF = { fire: 'fire', frost: 'ice', leaf: 'wind', spark: 'thunder', cosmic: 'dark', bubble: 'water', candy: 'light', shadow: 'dark', gold: 'earth', prism: 'light' };
const e8Of = k => E8_OF[k] || 'thunder';
const petElement = p => e8Of(abilityElement(formOf(p).pal));
const SHOTS = {
  twin: { name: 'Twin Shot', desc: 'Two quick shots side by side.' },
  spread: { name: 'Fan', desc: 'A wide fan of shots that covers the sky.' },
  lance: { name: 'Lance', desc: 'Fast needles that pierce every enemy in a line.' },
  volley: { name: 'Volley', desc: 'Three shots at once, one from each eye.' },
  seeker: { name: 'Seekers', desc: 'Orbs that curve toward the nearest enemy.' },
  wave: { name: 'Wave', desc: 'Two shots that weave around each other.' },
  burst: { name: 'Burst', desc: 'A short blast of many sparks. Strong up close.' },
  chain: { name: 'Chain', desc: 'Bolts that jump on to a second enemy.' },
  orbit: { name: 'Orbit', desc: 'Orbs circle the ship and hit anything nearby.' },
  bouncer: { name: 'Bouncers', desc: 'Bubbles that ricochet off the edges.' },
  boomerang: { name: 'Boomerang', desc: 'Spinning blades that fly out and come back.' },
  shard: { name: 'Shards', desc: 'Crystals that split into three when they hit.' },
};
const SPECIALS = {
  nova: { name: 'Nova Blast', desc: 'Hits every enemy on screen and wipes out their shots.' },
  shield: { name: 'Bubble Shield', desc: 'Nothing can hurt the ship for 6 seconds.' },
  meteor: { name: 'Meteor Rain', desc: 'Meteors crash down all over the sky.' },
  clone: { name: 'Mirror Twin', desc: 'A copy of the ship fights alongside for 8 seconds.' },
  warp: { name: 'Time Warp', desc: 'Everything else slows right down for 6 seconds.' },
  beam: { name: 'Mega Beam', desc: 'A huge beam burns straight ahead for 3 seconds.' },
  swarm: { name: 'Star Swarm', desc: 'A swarm of homing stars bursts out.' },
};
function abilityElement(pal) {
  const sp = { galaxy: 'cosmic', aurora: 'prism', sunset: 'fire', ocean: 'frost', gold: 'gold', prism: 'prism', shadow: 'shadow', snow: 'frost', statue: 'gold' }[pal.id];
  if (sp) return sp;
  let h = pal.h, s = pal.s;
  if (typeof h !== 'number' || typeof s !== 'number') { const q = hex2hsl(pal.base); h = q[0]; s = q[1]; }
  if (s < 22) return 'shadow';
  if (h < 45 || h >= 345) return 'fire';
  if (h < 70) return 'spark';
  if (h < 165) return 'leaf';
  if (h < 200) return 'bubble';
  if (h < 250) return 'frost';
  if (h < 295) return 'cosmic';
  return 'candy';
}
/* the ability for a form (its current evolution) and the pet's DNA seed */
function petAbility(f, seed) {
  const X = f.x || {}, stage = f.stage || 1;
  const R = mulberry32(((seed || f.seed || 1) ^ 0x51ED27) >>> 0);
  const el = abilityElement(f.pal);
  const shots = [['twin', 1.5], ['volley', 0.4], ['wave', 0.4]];
  const add = (k, w) => shots.push([k, w]);
  if (X.wings) add('spread', 3 + (X.wings.n === 2 ? 1 : 0));
  if (X.horns) add(X.horns.t === 'crystal' ? 'shard' : 'lance', 3);
  if (['triple', 'quad', 'compound'].includes(f.eyes.t)) add('volley', 3.5);
  if (f.eyes.t === 'cyclops') add('lance', 2);
  if (f.tail.t === 'star' || X.halo === 'stars') add('seeker', 3);
  if (['ribbon', 'feather', 'fish'].includes(f.tail.t) || f.arms.t === 'tentacle' || f.legs.t === 'tentacle') add('wave', 2.5);
  if (f.tail.t === 'flame' || (X.crest && X.crest.t === 'flame') || X.aura === 'flame' || el === 'fire') add('burst', f.tail.t === 'flame' ? 3 : 1.2);
  if (f.tail.t === 'bolt' || el === 'spark') add('chain', f.tail.t === 'bolt' ? 3.5 : 1);
  if (X.orbs) add('orbit', 4);
  if (f.body.fur === 'slime' || el === 'bubble') add('bouncer', f.body.fur === 'slime' ? 3 : 1);
  if (['claw', 'crystal'].includes(f.arms.t) || ['fangs', 'tusks'].includes(f.mouth)) add('boomerang', 2.2);
  if (f.tail.t === 'crystal' || X.armor || f.arms.t === 'crystal') add('shard', 2);
  if (f.tail.t === 'leaf' || el === 'leaf') add('seeker', 0.8);
  const pickW = list => { let tot = 0; list.forEach(p => { tot += p[1]; }); let r = R() * tot; for (const p of list) { r -= p[1]; if (r < 0) return p[0]; } return list[list.length - 1][0]; };
  const shot = pickW(shots);
  const sp = Object.keys(SPECIALS).map(k => [k, 0.6]);
  const bump = (k, w) => { sp.find(p => p[0] === k)[1] += w; };
  if (X.aura) bump('nova', 4);
  if (X.halo === 'ring' || X.halo === 'crown') bump('shield', 3);
  if (X.armor) bump('shield', 2);
  if (X.wings && X.wings.n === 2) bump('clone', 3); else if (X.wings) bump('meteor', 1.5);
  if (el === 'cosmic' || el === 'shadow') bump('warp', 2.5);
  if ((X.horns && X.horns.t === 'uni') || f.eyes.t === 'cyclops' || f.eyes.t === 'quad') bump('beam', 3);
  if (f.tail.t === 'star' || X.halo === 'stars') bump('swarm', 3);
  if (el === 'fire') bump('meteor', 1.5);
  if (el === 'bubble' || el === 'frost') bump('shield', 1);
  const special = pickW(sp);
  const power = r1(1 + 0.18 * (stage - 1) + R() * 0.12);
  const rate = r1(1 - 0.04 * (stage - 1) + (R() - 0.5) * 0.12) || 1;
  const speed = r1(0.92 + R() * 0.22);
  const size = r1(0.9 + R() * 0.3);
  const count = shotCount(shot, stage), _c0 = { spread: stage >= 6 ? 5 : 3, volley: 3, seeker: stage >= 4 ? 2 : 1, chain: stage >= 5 ? 2 : 1, orbit: stage >= 6 ? 3 : 2, burst: stage >= 4 ? 7 : 5, boomerang: stage >= 5 ? 2 : 1, bouncer: 2, wave: 2, twin: 2, lance: stage >= 5 ? 2 : 1, shard: 1 }[shot];
  // drawn after everything above, so older pets keep the Star Blaster ability they already had
  const tw = Object.keys(TWISTS).map(k => [k, 0.7]);
  const tb = (k, w) => { tw.find(p => p[0] === k)[1] += w; };
  ({ fire: [['burn', 4]], frost: [['chill', 4]], spark: [['shock', 4]], leaf: [['venom', 4]], bubble: [['knock', 4]], cosmic: [['pierce', 3], ['shock', 1]], candy: [['leech', 4]], shadow: [['leech', 2], ['pierce', 2]], gold: [['crit', 4]], prism: [['crit', 2], ['shock', 2]] }[el] || []).forEach(([k, w]) => tb(k, w));
  const twist = pickW(tw);
  const sg = [['burst', 1.2], ['slam', 0.6], ['whip', 0.6], ['fury', 0.6], ['gust', 0.5]];
  const sb = (k, w) => { const p = sg.find(q => q[0] === k); if (p) p[1] += w; else sg.push([k, w]); };
  if (X.horns) sb('rush', 3);
  if (X.wings) sb('gust', 3);
  if (['lizard', 'devil', 'ribbon', 'fish', 'feather', 'fox', 'lion'].includes(f.tail.t)) sb('whip', 2.5);
  if (['claw', 'crystal'].includes(f.arms.t) || ['fangs', 'tusks'].includes(f.mouth)) sb('fury', 3);
  if (['cyclops', 'quad', 'compound'].includes(f.eyes.t)) sb('eyebeam', 3);
  if (f.body.fur === 'slime' || (f.body.w || 0) > 48) sb('slam', 2.5);
  if (X.orbs) sb('orbs', 4);
  if (X.armor || X.spikes || f.body.fur === 'spiky' || f.tail.t === 'crystal' || (X.crest && X.crest.t === 'spike')) sb('spikes', 3);
  const strong = pickW(sg);
  const E = ELEMENTS[el], S = SHOTS[shot], P = SPECIALS[special];
  const stars = starsOf(rarityOf(f)), star = starKit(stars, seed || f.seed || 1);
  return { el, shot, special, stars, star, starStrong: star ? { key: star.strong, tier: stars } : null, starUlt: star ? { key: star.ult, tier: stars } : null, power, rate, speed, size, count, name: `${E.name} ${S.name}`, color: E.color, core: E.core, dark: E.dark, rainbow: !!E.rainbow, shotDesc: S.desc, specialName: P.name, specialDesc: P.desc,
    twist, twistName: TWISTS[twist].name, twistDesc: TWISTS[twist].desc, strong, strongName: strong === 'spikes' ? espikeName(el) : `${E.name} ${STRONGS[strong].name}`, strongDesc: strong === 'spikes' ? espikeDesc(el) : STRONGS[strong].desc };
}
/* every pet's signature effect: it rides on all of its hits in the Dungeon, whichever cards it uses */
const TWISTS = {
  burn: { name: 'Burn', desc: 'Every hit sets monsters on fire.' },
  chill: { name: 'Chill', desc: 'Every hit slows monsters down.' },
  shock: { name: 'Shock', desc: 'Hits can zap another monster nearby.' },
  venom: { name: 'Venom', desc: 'Hits poison monsters, and the poison stacks up.' },
  knock: { name: 'Knockback', desc: 'Hits knock monsters flying.' },
  pierce: { name: 'Pierce', desc: 'Shots punch straight through monsters.' },
  leech: { name: 'Leech', desc: 'Hits heal a little health.' },
  crit: { name: 'Lucky Strike', desc: 'Far more critical hits, and they hit harder.' },
};
/* every pet's own strong attack in the Dungeon, picked from its body */
const STRONGS = {
  rush: { name: 'Horn Rush', desc: 'Charge forward and blast everything in the way.' },
  gust: { name: 'Gale Slash', desc: 'A huge crescent blade that slices through a line of monsters.' },
  whip: { name: 'Tail Cyclone', desc: 'Spin like a top, hitting everything around you.' },
  fury: { name: 'Claw Fury', desc: 'A flurry of giant slashes in front of you.' },
  eyebeam: { name: 'Eye Laser', desc: 'A blazing laser shoots from your eyes.' },
  slam: { name: 'Belly Slam', desc: 'Leap up and crash down with a shockwave.' },
  orbs: { name: 'Orb Barrage', desc: 'A ring of orbs flies out and hunts monsters.' },
  burst: { name: 'Element Bomb', desc: 'A big explosion right on top of a monster.' },
  spikes: { name: 'Spike Bloom', desc: 'Giant spikes burst from the ground all around you.' },
};
/* a small badge used on the pet card and the Star Blaster start screen */
function abilityHTML(ab, short) {
  const dot = `<i class="ab-dot" style="--ac:${ab.color};--ak:${ab.dark}"></i>`;
  if (short) return `<span class="ability-chip">${dot}<b>${esc(ab.name)}</b><span>· ${esc(ab.specialName)}</span></span>`;
  return `<div class="ability">${dot}<div><b>${esc(ab.name)}</b><span>${esc(ab.shotDesc)}</span><b class="sp">Special: ${esc(ab.specialName)}</b><span>${esc(ab.specialDesc)}</span><small class="mono">Power ${ab.power.toFixed(1)} · grows with every evolution</small></div></div>`;
}

/* how many projectiles a Normal attack fires at a given stage */
function shotCount(shot, stage) { return { spread: stage >= 6 ? 5 : 3, volley: 3, seeker: stage >= 4 ? 2 : 1, chain: stage >= 5 ? 2 : 1, orbit: stage >= 6 ? 3 : 2, burst: stage >= 4 ? 7 : 5, boomerang: stage >= 5 ? 2 : 1, bouncer: 2, wave: 2, twin: 2, lance: stage >= 5 ? 2 : 1, shard: 1 }[shot] || 1; }
/* abilities inherited through fusion replace the pet's own rolls, slot by slot */
function applyAbOv(AB, p) {
  const ov = p && p.abOv; if (!ov) return AB;
  const E = ELEMENTS[AB.el], stage = (p.stage || 1);
  AB = Object.assign({}, AB);
  if (ov.normal && SHOTS[ov.normal.shot]) { const sh = ov.normal.shot; AB.shot = sh; AB.name = `${E.name} ${SHOTS[sh].name}`; AB.shotDesc = SHOTS[sh].desc; AB.count = shotCount(sh, stage); }
  if (ov.strong && ov.strong.key) { const k = ov.strong.key; if (k.slice(0, 2) === 'x_' && STAR_POOLS[ov.strong.tier] && STAR_POOLS[ov.strong.tier].strong[k.slice(2)]) AB.starStrong = { key: k.slice(2), tier: ov.strong.tier }; else if (k.slice(0, 2) === 's_' && STRONGS[k.slice(2)]) { AB.starStrong = null; AB.strong = k.slice(2); AB.strongName = AB.strong === 'spikes' ? espikeName(AB.el) : `${E.name} ${STRONGS[AB.strong].name}`; AB.strongDesc = AB.strong === 'spikes' ? espikeDesc(AB.el) : STRONGS[AB.strong].desc; } }
  if (ov.ult && ov.ult.key) { const k = ov.ult.key; if (k.slice(0, 2) === 'y_' && STAR_POOLS[ov.ult.tier] && STAR_POOLS[ov.ult.tier].ult[k.slice(2)]) AB.starUlt = { key: k.slice(2), tier: ov.ult.tier }; else if (k.slice(0, 2) === 'u_' && SPECIALS[k.slice(2)]) { AB.starUlt = null; AB.special = k.slice(2); AB.specialName = SPECIALS[AB.special].name; AB.specialDesc = SPECIALS[AB.special].desc; } }
  return AB;
}
