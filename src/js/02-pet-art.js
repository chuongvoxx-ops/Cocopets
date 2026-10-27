/* ---------- pet genetics: every body part is its own gene ---------- */
const RARITY = [
  { name: 'Common', c: 'var(--r-common)' },
  { name: 'Uncommon', c: 'var(--r-uncommon)' },
  { name: 'Rare', c: 'var(--r-rare)' },
  { name: 'Epic', c: 'var(--r-epic)' },
  { name: 'Secret', c: 'var(--r-secret)' },
  { name: 'Legendary', c: 'var(--r-legend)' },
];
/* star rank: three stars is a common pet, four a good one, five a rare pet with powerful abilities (Secret counts as five),
   six a golden Legendary: only an egg in a hundred, or one fusion of two five-stars in twenty */
const starsOf = r => r >= 5 ? 6 : r >= 3 ? 5 : r >= 2 ? 4 : 3;
const starsHTML = (n, cls) => `<span class="stars${cls ? ' ' + cls : ''} s${n}" aria-label="${n} stars">${'★'.repeat(n)}</span>`;
const CARD_STARS = { common: 3, rare: 3, epic: 4, legend: 5 };
/* egg odds: 84% three-star, 10% four-star, 5% five-star, 1% six-star golden Legendary */
const STAR_RATES = [[3, 84], [4, 10], [5, 5], [6, 1]];
const PITY_N = 10;   // ten 10-egg summons in a row with no six-star: the next 10-egg summon brings one for certain
const GOLD_FUSE = 0.05;   // the chance two five-stars fuse into a six-star
function rollStars(R) { R = R || Math.random; let r = R() * 100; for (const [s, w] of STAR_RATES) { r -= w; if (r < 0) return s; } return 3; }
/* a genome of exactly this many stars: random forms are drawn until one lands in the tier */
function summonGenome(stars, R) {
  R = R || Math.random; let g = null;
  // a six-star is a five-star body turned golden
  if (stars >= 6) { g = summonGenome(5, R); legendCoat(g.form, R); gildForm(g.form, R); return g; }
  for (let i = 0; i < 600; i++) { g = makeGenome(R); if (starsOf(rarityOf(g.form)) === stars) return g; }
  return g;
}
const PERSONALITIES = [
  { id: 'playful', name: 'Playful', w: 1, desc: 'Loves games. Playing gives extra joy.' },
  { id: 'sleepy', name: 'Sleepy', w: 1, desc: 'Naps a lot. Energy lasts longer.' },
  { id: 'foodie', name: 'Foodie', w: 1, desc: 'Always peckish. Meals give extra joy.' },
  { id: 'cuddly', name: 'Cuddly', w: 1, desc: 'Lives for pats. Pats give extra joy.' },
  { id: 'curious', name: 'Curious', w: 1, desc: 'Has a nose for treasure. Digging finds more.' },
  { id: 'shy', name: 'Shy', w: 1, desc: 'A hide-and-seek champion. Hard to find.' },
];
const persOf = id => byId(PERSONALITIES, id);

/* catalogues: w = chance at hatching (0 = only reachable by evolving), r = rarity tier */
const G = (id, name, r, w) => ({ id, name, r, w });
const EARS = [
  G('none', 'No ears', 1, 5), G('nub', 'Nub ears', 0, 12), G('round', 'Round ears', 0, 16), G('mouse', 'Mouse ears', 0, 8),
  G('cat', 'Pointy ears', 0, 18), G('bunny', 'Bunny ears', 1, 8), G('lop', 'Lop ears', 0, 10), G('fin', 'Fin ears', 2, 5),
  G('antenna', 'Antennae', 1, 6), G('leaf', 'Leaf sprouts', 1, 6), G('feather', 'Feather tufts', 2, 4),
  G('fox', 'Fox ears', 1, 0), G('lynx', 'Tufted ears', 1, 0), G('bat', 'Bat ears', 1, 0), G('bloom', 'Flower ears', 2, 0),
  G('elf', 'Long pointed ears', 1, 0), G('crystal', 'Crystal ears', 3, 0), G('flame', 'Flame ears', 3, 0),
];
const EYES = [
  G('round', 'Round eyes', 0, 30), G('dot', 'Dot eyes', 0, 14), G('big', 'Big eyes', 0, 14), G('button', 'Button eyes', 0, 10),
  G('oval', 'Bean eyes', 0, 8), G('sparkle', 'Sparkle eyes', 1, 10), G('sleepy', 'Sleepy eyes', 1, 7), G('cat', 'Cat eyes', 1, 6),
  G('heart', 'Heart eyes', 2, 3), G('star', 'Star eyes', 2, 3), G('hetero', 'Odd eyes', 3, 2), G('cyclops', 'One big eye', 3, 0.6),
  G('fierce', 'Fierce eyes', 1, 0), G('glow', 'Glowing eyes', 2, 0), G('triple', 'Three eyes', 3, 0), G('quad', 'Four eyes', 3, 0),
  G('compound', 'Bug eyes', 3, 0),
];
const MOUTHS = [
  G('smile', 'Sweet smile', 0, 30), G('cat', 'Cat smile', 0, 30), G('blep', 'Blep', 2, 6), G('o', 'Little o', 0, 5),
  G('fang', 'Tiny fang', 1, 8), G('buck', 'Buck teeth', 1, 5), G('beak', 'Beak', 2, 3), G('smirk', 'Smirk', 1, 4),
  G('grin', 'Big grin', 1, 0), G('fangs', 'Fangs', 1, 0), G('tusks', 'Tusks', 2, 0), G('zigzag', 'Monster mouth', 2, 0), G('tongue', 'Tongue out', 1, 0),
];
const NOSES = [G('none', 'No nose', 0, 40), G('dot', 'Button nose', 0, 22), G('tri', 'Kitten nose', 0, 12), G('heart', 'Heart nose', 1, 5), G('snout', 'Snout', 1, 5), G('muzzle', 'Muzzle', 0, 10)];
const CHEEKS = [G('blush', 'Rosy cheeks', 0, 50), G('none', 'Plain cheeks', 0, 10), G('freckles', 'Freckles', 1, 10), G('whiskers', 'Whiskers', 0, 10), G('dots', 'Cheek dots', 1, 5), G('swirl', 'Cheek swirls', 2, 3), G('fluff', 'Cheek fluff', 1, 0), G('marks', 'Face paint', 1, 0)];
const ARMS = [
  G('none', 'No arms', 0, 38), G('nub', 'Stubby arms', 0, 42), G('paw', 'Little paws', 0, 8), G('flipper', 'Flippers', 1, 5),
  G('tentacle', 'Tentacle arms', 2, 3), G('wingarm', 'Wing arms', 2, 2), G('mitten', 'Mitten hands', 1, 0), G('claw', 'Claws', 1, 0),
  G('long', 'Long arms', 1, 0), G('crystal', 'Crystal fists', 3, 0),
];
const LEGS = [
  G('nub', 'Nub feet', 0, 60), G('paw', 'Paw feet', 0, 14), G('webbed', 'Webbed feet', 1, 6), G('stump', 'Stompy legs', 0, 8),
  G('tentacle', 'Tentacle legs', 2, 3), G('float', 'Floats', 3, 1.2), G('long', 'Long legs', 1, 0), G('bird', 'Bird legs', 1, 0),
  G('hoof', 'Hooves', 1, 0), G('boots', 'Fluffy boots', 1, 0),
];
const TAILS = [
  G('none', 'No tail', 1, 6), G('nub', 'Nub tail', 0, 10), G('puff', 'Puff tail', 0, 14), G('cat', 'Long tail', 0, 14),
  G('fluffy', 'Fluffy tail', 0, 16), G('curly', 'Curly tail', 0, 12), G('lion', 'Tufted tail', 1, 6), G('fish', 'Fin tail', 2, 5),
  G('lizard', 'Lizard tail', 2, 4), G('leaf', 'Leaf tail', 2, 3), G('devil', 'Arrow tail', 2, 2), G('star', 'Star tail', 3, 0.6),
  G('fox', 'Fox brush', 1, 0), G('flame', 'Flame tail', 3, 0), G('feather', 'Plume tail', 2, 0), G('ribbon', 'Ribbon tail', 2, 0),
  G('crystal', 'Crystal tail', 3, 0), G('bolt', 'Bolt tail', 3, 0),
];
const FURS = [G('smooth', 'Smooth', 0, 44), G('fluffy', 'Fluffy fur', 0, 22), G('woolly', 'Woolly fur', 1, 7), G('shaggy', 'Shaggy fur', 1, 5), G('sleek', 'Sleek coat', 0, 8), G('scaly', 'Scales', 2, 4), G('slime', 'Jelly body', 2, 3), G('spiky', 'Spiky fur', 2, 0)];
const PATTERNS = [
  G('plain', 'Plain', 0, 24), G('spots', 'Spotted', 0, 14), G('stripes', 'Striped', 0, 11), G('socks', 'Socks', 0, 9), G('cap', 'Capped', 1, 8),
  G('mask', 'Masked', 1, 6), G('patch', 'Eye patch', 1, 6), G('freckled', 'Speckled', 0, 5), G('split', 'Two-tone', 2, 3), G('saddle', 'Saddle marks', 1, 4),
  G('tiger', 'Tiger stripes', 1, 0), G('diamond', 'Diamond marks', 2, 0),
];
const BELLIES = [G('oval', 'Belly patch', 0, 50), G('round', 'Round belly', 0, 15), G('chest', 'Fluffy chest', 0, 12), G('heart', 'Heart belly', 1, 4), G('none', 'No belly patch', 0, 10)];
const CAT = { ears: EARS, eyes: EYES, mouth: MOUTHS, nose: NOSES, cheeks: CHEEKS, arms: ARMS, legs: LEGS, tail: TAILS, fur: FURS, pattern: PATTERNS, belly: BELLIES };
const tname = (cat, id) => (CAT[cat].find(o => o.id === id) || { name: id }).name;
const trar = (cat, id) => (CAT[cat].find(o => o.id === id) || { r: 0 }).r;

/* how each part can develop when the pet evolves (a type may repeat to make "stays the same" likelier) */
const NEXT = {
  ears: { none: ['none', 'nub', 'antenna', 'fin', 'leaf'], nub: ['round', 'cat', 'mouse', 'nub', 'bunny'], round: ['round', 'mouse', 'lop', 'bat'], mouse: ['mouse', 'round', 'bat'], cat: ['cat', 'fox', 'lynx', 'bat', 'elf'], fox: ['fox', 'lynx', 'elf'], lynx: ['lynx', 'fox'], bunny: ['bunny', 'lop', 'elf'], lop: ['lop', 'bunny'], bat: ['bat', 'elf', 'flame'], fin: ['fin', 'elf'], antenna: ['antenna', 'feather'], leaf: ['leaf', 'bloom'], bloom: ['bloom'], feather: ['feather', 'elf'], elf: ['elf', 'crystal'], crystal: ['crystal'], flame: ['flame'] },
  eyes: { round: ['round', 'big', 'cat', 'sparkle', 'fierce'], dot: ['dot', 'round', 'button', 'oval'], big: ['big', 'sparkle', 'round'], button: ['button', 'round', 'glow'], oval: ['oval', 'cat', 'round'], sparkle: ['sparkle', 'star', 'heart', 'big'], sleepy: ['sleepy', 'round', 'fierce'], cat: ['cat', 'fierce', 'glow'], heart: ['heart', 'sparkle'], star: ['star', 'sparkle', 'glow'], hetero: ['hetero', 'cat'], fierce: ['fierce', 'glow', 'cat'], glow: ['glow'], cyclops: ['cyclops'], triple: ['triple'], quad: ['quad'], compound: ['compound'] },
  mouth: { smile: ['smile', 'cat', 'fang', 'grin', 'tongue'], cat: ['cat', 'fangs', 'blep'], blep: ['blep', 'tongue', 'cat'], o: ['o', 'smile', 'beak'], fang: ['fang', 'fangs', 'grin'], buck: ['buck', 'grin'], beak: ['beak'], smirk: ['smirk', 'fang'], grin: ['grin', 'zigzag'], fangs: ['fangs', 'tusks', 'zigzag'], tusks: ['tusks'], zigzag: ['zigzag'], tongue: ['tongue', 'grin'] },
  arms: { none: ['none', 'nub', 'nub', 'flipper'], nub: ['paw', 'mitten', 'nub', 'flipper'], paw: ['paw', 'claw', 'long', 'mitten'], mitten: ['mitten', 'paw', 'claw'], flipper: ['flipper', 'wingarm'], tentacle: ['tentacle'], claw: ['claw', 'long', 'crystal'], wingarm: ['wingarm'], long: ['long', 'claw'], crystal: ['crystal'] },
  legs: { nub: ['nub', 'paw', 'stump', 'webbed', 'paw'], paw: ['paw', 'boots', 'hoof', 'stump'], stump: ['stump', 'hoof', 'boots'], webbed: ['webbed', 'paw'], long: ['paw', 'stump'], bird: ['webbed'], hoof: ['hoof'], boots: ['boots', 'paw'], tentacle: ['tentacle'], float: ['float'] },
  tail: { none: ['none', 'nub', 'puff'], nub: ['nub', 'puff', 'cat', 'curly'], puff: ['puff', 'fluffy', 'fox'], cat: ['cat', 'lion', 'devil', 'fox'], fluffy: ['fluffy', 'fox', 'feather'], curly: ['curly', 'cat', 'devil'], lion: ['lion', 'flame', 'star'], fish: ['fish', 'ribbon', 'feather'], lizard: ['lizard', 'flame', 'crystal'], leaf: ['leaf', 'ribbon'], devil: ['devil', 'flame', 'bolt'], fox: ['fox'], flame: ['flame'], feather: ['feather'], ribbon: ['ribbon'], crystal: ['crystal'], star: ['star'], bolt: ['bolt'] },
  fur: { smooth: ['smooth', 'fluffy', 'sleek', 'scaly'], fluffy: ['fluffy', 'shaggy', 'woolly'], woolly: ['woolly', 'shaggy'], shaggy: ['shaggy', 'spiky', 'fluffy'], sleek: ['sleek', 'scaly'], scaly: ['scaly', 'spiky'], slime: ['slime', 'sleek'], spiky: ['spiky'] },
  pattern: { plain: ['plain', 'spots', 'stripes', 'cap', 'saddle'], spots: ['spots', 'freckled', 'patch'], stripes: ['stripes', 'tiger'], socks: ['socks', 'cap'], cap: ['cap', 'mask', 'split'], mask: ['mask', 'tiger'], patch: ['patch', 'spots'], freckled: ['freckled', 'spots'], split: ['split', 'diamond'], tiger: ['tiger', 'diamond'], diamond: ['diamond'], saddle: ['saddle', 'stripes'] },
};
/* legs stay short and round at every stage, like a pocket monster's; the old long and bird legs became paws and webbed feet */
const LEG_LEN = { nub: [0, 4], paw: [4, 9], stump: [4, 9], webbed: [2, 7], long: [4, 9], bird: [2, 7], hoof: [4, 9], boots: [4, 9], tentacle: [4, 9], float: [10, 14] };
const LEG_ALIAS = { long: 'paw', bird: 'webbed' };
const MULTI_TAIL = ['cat', 'fluffy', 'fox', 'lion', 'devil', 'flame', 'feather', 'ribbon', 'crystal', 'star', 'bolt', 'leaf', 'lizard', 'fish', 'curly'];

/* ---------- evolution stages and gemstones ---------- */
const GEMS = {
  quartz: { name: 'Rose Quartz', color: '#F7A8C4', dark: '#C9668E' },
  amethyst: { name: 'Amethyst', color: '#A77BE8', dark: '#6E45B8' },
  citrine: { name: 'Citrine', color: '#F5C542', dark: '#B9861A' },
  emerald: { name: 'Emerald', color: '#3FC48A', dark: '#1E8A5C' },
  sapphire: { name: 'Sapphire', color: '#4F8FF0', dark: '#2A5AB0' },
  starstone: { name: 'Starstone', color: '#EAF2FF', dark: '#8EA6DE' },
};
const GEM_ORDER = ['quartz', 'amethyst', 'citrine', 'emerald', 'sapphire', 'starstone'];
const STAGES = [
  null,
  { n: 1, name: 'Hatchling', scale: 0.58, bond: 0, gem: null, perk: 'Just hatched. Tiny and curious.' },
  { n: 2, name: 'Sprout', scale: 0.62, bond: 2, gem: 'quartz', perk: 'Grows a gem and a first new feature. Learns Spin.' },
  { n: 3, name: 'Junior', scale: 0.66, bond: 4, gem: 'amethyst', perk: 'Gets a neck, a mane or spikes. Learns Roll over and High five. +10% coins.' },
  { n: 4, name: 'Adept', scale: 0.70, bond: 7, gem: 'citrine', perk: 'Grows horns or antlers. Learns Backflip and digs faster.' },
  { n: 5, name: 'Guardian', scale: 0.73, bond: 11, gem: 'emerald', perk: 'Spreads wings, may grow pauldrons or a second set of horns, and learns Float. +20% coins. From here on it stops growing bigger and grows features instead.' },
  { n: 6, name: 'Mythic', scale: 0.75, bond: 16, gem: 'sapphire', perk: 'A second pair of wings, marks, armour, orbs or a second tail. Glows in the dark.' },
  { n: 7, name: 'Celestial', scale: 0.77, bond: 22, gem: 'starstone', perk: 'An aura and a halo or crown, extra wings, horns and armour. Leaves a star trail and finds a pearl every day.' },
];
const STAGE_GEM = { 2: 'quartz', 3: 'amethyst', 4: 'citrine', 5: 'emerald', 6: 'sapphire', 7: 'starstone' };

/* ---------- colour ---------- */
function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const x = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + x(f(0)) + x(f(8)) + x(f(4));
}
function hex2hsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}
const HUE_NAMES = [
  [12, 'Cherry', 'Coral'], [28, 'Tangerine', 'Apricot'], [45, 'Honey', 'Peach'], [62, 'Lemon', 'Butter'], [85, 'Lime', 'Pistachio'],
  [150, 'Clover', 'Mint'], [185, 'Lagoon', 'Seafoam'], [210, 'Denim', 'Sky'], [240, 'Bluebell', 'Periwinkle'], [270, 'Indigo', 'Lilac'],
  [300, 'Grape', 'Lavender'], [330, 'Orchid', 'Bubblegum'], [361, 'Strawberry', 'Rose'],
];
function colorName(h, s, l) {
  if (l > 86 && s < 35) return 'Cream';
  if (l < 36) return s < 30 ? 'Charcoal' : 'Midnight';
  if (s < 26) return l > 62 ? 'Silver' : 'Smoke';
  h = ((h % 360) + 360) % 360;
  for (const [lim, deep, light] of HUE_NAMES) if (h < lim) return l > 72 ? light : deep;
  return 'Rose';
}
const SPECIAL_PALS = [
  { id: 'galaxy', name: 'Galaxy', r: 3, w: 2.2, base: '#5B4FA8', dk: '#3F3580', lt: '#7A6FC4', belly: '#D9D2FF', sec: '#E59BD8', grad: ['#7464CC', '#3B2F7E'], stars: true, cheek: '#FF9BD2', inner: '#E59BD8', iris: '#7FD3F2' },
  { id: 'aurora', name: 'Aurora', r: 3, w: 2.2, base: '#9EE3D0', dk: '#7AB8C9', lt: '#C9F5E8', belly: '#F4FFFB', sec: '#C6A7F5', grad: ['#9FF0C9', '#B9A6F7', '#F7A8D2'], cheek: '#FF8FB8', inner: '#F7B8D8', iris: '#7B61D9' },
  { id: 'sunset', name: 'Sunset', r: 2, w: 3, base: '#FFA978', dk: '#E07B5A', lt: '#FFC9A6', belly: '#FFF0E0', sec: '#F06F9F', grad: ['#FFC36B', '#F57FAE'], cheek: '#FF6F91', inner: '#FFB3C1', iris: '#7A4FD0' },
  { id: 'ocean', name: 'Deep Ocean', r: 2, w: 3, base: '#6FB6F0', dk: '#4D7FD1', lt: '#9DD0F7', belly: '#E8F3FF', sec: '#5966D9', grad: ['#78DCF2', '#6474E3'], cheek: '#FF8FB0', inner: '#B9C9FF', iris: '#F2A93B' },
  { id: 'gold', name: 'Golden', r: 4, w: 0.5, base: '#F5CF58', dk: '#C99A22', lt: '#FFE79A', belly: '#FFF4CC', sec: '#E0A82E', grad: ['#FFEB9C', '#E3AA2F'], shine: true, cheek: '#FF9A76', inner: '#FFD9A8', iris: '#B5651D' },
  { id: 'prism', name: 'Prism', r: 4, w: 0.5, base: '#F2E8FF', dk: '#B9A6E8', lt: '#FFFFFF', belly: '#FFFFFF', sec: '#8FD9F7', grad: ['#FFD1E8', '#D7F0FF', '#D9FFD9', '#FFF3C4'], shine: true, cheek: '#FF9BC8', inner: '#FFD1E8', iris: '#9B7BEA' },
  { id: 'shadow', name: 'Shadow', r: 2, w: 2, base: '#4A4458', dk: '#2F2A3B', lt: '#6A6380', belly: '#B9B2C9', sec: '#8E7BD6', cheek: '#C77BB3', inner: '#8E7BD6', iris: '#F5D547' },
  { id: 'snow', name: 'Snow', r: 1, w: 3, base: '#F4F2ED', dk: '#CFCAC0', lt: '#FFFFFF', belly: '#FFFFFF', sec: '#B9B2A6', cheek: '#FF9AB0', inner: '#F7C3CF', iris: '#5A9FE0' },
];
function huePal(h, s, l, R) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 10, 92); l = clamp(l, 30, 86);
  const m = R();
  const sec = m < 0.45 ? hsl2hex(h, s + 8, l - 22)
    : m < 0.75 ? hsl2hex(h + (R() < 0.5 ? -38 : 38), s, l - 8)
      : hsl2hex(h + 180 + (R() * 40 - 20), Math.max(40, s - 4), clamp(l - 6, 40, 78));
  return {
    id: 'hue', name: colorName(h, s, l), r: 0, h: r1(h), s: r1(s), l: r1(l),
    base: hsl2hex(h, s, l), dk: hsl2hex(h, s + 6, l - 17), lt: hsl2hex(h, s - 8, l + 11),
    belly: hsl2hex(h + (R() < 0.5 ? 0 : 18), s * 0.5, Math.min(97, l + 18 + (100 - l) * 0.25)),
    sec, inner: hsl2hex(345 + R() * 20 - 10, 72, 84), cheek: hsl2hex(352 + R() * 16 - 8, 88, 75),
    iris: hsl2hex(R() * 360, 68, 46),
  };
}
function makePal(R) {
  if (R() < 0.13) { const sp = wpick(R, SPECIAL_PALS); const p = Object.assign({}, sp); delete p.w; return p; }
  const h = R() * 360, v = R();
  const s = v < 0.12 ? 16 + R() * 16 : 46 + R() * 36;
  const l = v > 0.9 ? 40 + R() * 14 : 63 + R() * 17;
  return huePal(h, s, l, R);
}

/* ---------- hatching: a brand new baby ---------- */
const wid = (R, list) => wpick(R, list.filter(o => o.w > 0)).id;
function makeForm(R) {
  const pal = makePal(R);
  const eyesT = wid(R, EYES);
  const legsT = wid(R, LEGS);
  const ll = LEG_LEN[legsT];
  const tailT = wid(R, TAILS);
  const form = {
    v: 3, seed: Math.floor(R() * 1e9) + 1, stage: 1, grow: r1(0.95 + R() * 0.1) || 1,
    body: {
      h: r1(74 + R() * 16), w: r1(39 + R() * 9), headW: r1(0.95 + R() * 0.14), top: r1(R() < 0.06 ? R() * 0.2 : 0.25 + R() * 0.75),
      flat: r1(0.15 + R() * 0.8), waist: r1(R() < 0.15 ? 0.05 + R() * 0.08 : 0), fur: wid(R, FURS), belly: wid(R, BELLIES),
    },
    pal, pattern: wid(R, PATTERNS),
    eyes: { t: eyesT, size: r1(1.14 + R() * 0.26), gap: r1(0.3 + R() * 0.12), iris2: hsl2hex(R() * 360, 70, 50) },
    mouth: wid(R, MOUTHS), nose: wid(R, NOSES), cheeks: wid(R, CHEEKS),
    ears: { t: wid(R, EARS), size: r1(0.9 + R() * 0.25) },
    arms: { t: wid(R, ARMS), size: r1(0.9 + R() * 0.2) },
    legs: { t: legsT, len: r1(ll[0] + R() * (Math.min(ll[1], ll[0] + 6) - ll[0])), size: r1(0.92 + R() * 0.16) },
    tail: { t: tailT, size: r1(0.9 + R() * 0.25), n: 1 },
    x: {},
  };
  if (form.mouth === 'beak' && form.nose !== 'none') form.nose = 'none';
  return form;
}
function makeGenome(R) {
  R = R || Math.random;
  const form = makeForm(R);
  return { dna: { v: 3, seed: form.seed, personality: wpick(R, PERSONALITIES).id, size: 1 }, form };
}

/* ---------- evolving: every part may develop in a random direction ---------- */
const FUR_WORD = { smooth: 'smooth', fluffy: 'fluffy', woolly: 'woolly', shaggy: 'shaggy', sleek: 'sleek and shiny', scaly: 'into scales', slime: 'to jelly', spiky: 'spiky' };
const EYE_MUT = { triple: 'Opened a third eye!', cyclops: 'Its eyes merged into one big eye!', quad: 'Grew four eyes!', compound: 'Got shimmering bug eyes!' };
const MOUTH_WORD = { fang: 'Grew a tiny fang', fangs: 'Grew fangs', tusks: 'Grew tusks', grin: 'A big toothy grin', zigzag: 'A jagged monster mouth', tongue: 'Sticks its tongue out now', blep: 'Learned to blep', beak: 'Grew a beak', cat: 'A cat smile', smile: 'A sweet smile', smirk: 'A sly smirk', o: 'A little o mouth', buck: 'Buck teeth' };
const ARM_WORD = { nub: 'Grew stubby arms', paw: 'Grew little paws', mitten: 'Hands became round mittens', claw: 'Grew sharp claws', flipper: 'Grew flippers', wingarm: 'Arms turned into little wings', tentacle: 'Grew tentacle arms', long: 'Arms grew long', crystal: 'Fists turned to crystal' };
const LEG_WORD = { paw: 'Got proper paws', stump: 'Grew stompy legs', webbed: 'Got webbed feet', long: 'Grew long legs', bird: 'Grew bird legs', hoof: 'Grew hooves', boots: 'Feet became fluffy boots', tentacle: 'Grew tentacle legs', float: 'Now floats instead of walking', nub: 'Nub feet' };
const TAIL_WORD = { nub: 'a little nub', puff: 'a cotton puff', cat: 'a long tail', fluffy: 'a fluffy tail', curly: 'a curly tail', lion: 'a tufted tail', fish: 'a fin', lizard: 'a lizard tail', leaf: 'a leafy tail', devil: 'an arrow tail', star: 'a star tail', fox: 'a fox brush', flame: 'a flame tail', feather: 'a plume of feathers', ribbon: 'flowing ribbons', crystal: 'a crystal tail', bolt: 'a lightning bolt' };
const HORN_WORD = { goat: 'Grew curved horns', ram: 'Grew ram horns', uni: 'Grew a single spiral horn', devil: 'Grew little devil horns', bull: 'Grew wide bull horns', crystal: 'Grew crystal horns', antlers: 'Grew antlers' };
const WING_WORD = { feather: 'Spread feathered wings', bat: 'Spread bat wings', fairy: 'Grew see-through fairy wings', butterfly: 'Grew butterfly wings', leaf: 'Grew leaf wings', cloud: 'Grew fluffy cloud wings', crystal: 'Grew crystal wings', flame: 'Grew wings of flame' };

/* late stages stop growing in size (they were simply too big) and grow features instead */
const GROW_CAP = 1.18, GROW_CAP_LATE = 1.06, WING_CAP = 1.15;
function secondHorn(t, R) { const alt = Object.keys(HORN_WORD).filter(k => k !== t && k !== 'uni' && k !== 'antlers'); return alt[Math.floor(R() * alt.length)]; }
function wkey(R, pairs) { let tot = 0; for (const p of pairs) tot += p[1]; let r = R() * tot; for (const p of pairs) { r -= p[1]; if (r < 0) return p[0]; } return pairs[pairs.length - 1][0]; }
function evolveForm(prev, R, stage) {
  const f = JSON.parse(JSON.stringify(prev));
  f.stage = stage;
  const ch = [];
  const say = (pri, txt) => ch.push([pri, txt]);
  const nxt = (cat, cur) => { const l = NEXT[cat][cur] || [cur]; return l[Math.floor(R() * l.length)]; };
  const b = f.body, X = f.x;
  // stages 3 and 5 are the big transformations
  const major = stage === 3 || stage === 5;
  const P = p => R() < Math.min(0.92, p * (major ? 1.45 : 1));

  // grows up: taller, a defined head and chest, longer limbs, smaller-looking eyes
  const dh = stage >= 5 ? 0.5 + R() * 2 : 2 + R() * 6;
  b.h = r1(clamp(b.h + dh, 68, 106));
  b.w = r1(clamp(b.w + R() * 6 - 2.5, 34, 54));
  if (stage === 3) b.waist = r1(clamp(b.waist + 0.08 + R() * 0.09, 0, 0.45));
  else if (stage > 3) b.waist = r1(clamp(b.waist + 0.02 + R() * 0.06, 0, 0.45));
  b.headW = r1(clamp(b.headW + R() * 0.14 - 0.07, 0.78, 1.16));
  b.top = r1(clamp(b.top + R() * 0.3 - 0.15, 0, 1));
  b.flat = r1(clamp(b.flat + R() * 0.2 - 0.1, 0, 1));
  f.grow = stage >= 5 ? r1(Math.min(f.grow, GROW_CAP_LATE)) : r1(clamp(f.grow * (1 + R() * 0.06), 0.9, GROW_CAP));
  if (stage === 3 && b.waist > 0.08) say(2, 'Grew a neck and a proper chest');
  else if (stage < 5) say(0, dh > 5 ? 'Grew a lot taller' : 'Grew taller');
  f.eyes.size = r1(clamp(f.eyes.size * (0.965 + R() * 0.04), 0.8, 1.45));

  // fur and markings
  if (P(0.3)) { const n = nxt('fur', b.fur); if (n !== b.fur) { b.fur = n; say(3, `Fur turned ${FUR_WORD[n]}`); } }
  if (P(0.28)) { const n = nxt('pattern', f.pattern); if (n !== f.pattern) { f.pattern = n; say(2, `New markings: ${tname('pattern', n).toLowerCase()}`); } }

  // ears
  if (stage >= 5 && R() < 0.08 && f.ears.t !== 'none') { f.ears.t = R() < 0.5 ? 'crystal' : 'flame'; say(4, `Ears turned into ${f.ears.t === 'crystal' ? 'crystal' : 'flames'}`); }
  else if (P(0.5)) { const n = nxt('ears', f.ears.t); if (n !== f.ears.t) { f.ears.t = n; say(3, n === 'none' ? 'Its ears disappeared' : `Ears became ${tname('ears', n).toLowerCase()}`); } }
  else if (f.ears.t !== 'none') {
    const cap = ['mouse', 'bunny', 'elf', 'fox', 'lop', 'bat'].includes(f.ears.t) ? 1.3 : 1.55;
    const was = f.ears.size;
    f.ears.size = r1(clamp(f.ears.size * (1.08 + R() * 0.14), 0.7, cap));
    if (f.ears.size > was) say(1, 'Ears grew bigger');
  }

  // eyes
  if (stage >= 4 && R() < 0.07 && !EYE_MUT[f.eyes.t]) { f.eyes.t = wkey(R, [['triple', 4], ['cyclops', 3], ['quad', 2], ['compound', 2]]); say(5, EYE_MUT[f.eyes.t]); }
  else if (P(0.35)) { const n = nxt('eyes', f.eyes.t); if (n !== f.eyes.t) { f.eyes.t = n; say(2, `Eyes became ${tname('eyes', n).toLowerCase()}`); } }
  if (R() < 0.2) { f.pal = Object.assign({}, f.pal, { iris: hsl2hex(R() * 360, 70, 48) }); }

  // mouth, nose, cheeks
  if (P(0.35)) { const n = nxt('mouth', f.mouth); if (n !== f.mouth) { f.mouth = n; if (n === 'beak') f.nose = 'none'; say(2, MOUTH_WORD[n]); } }
  if (R() < 0.12 && f.mouth !== 'beak') { const n = wid(R, NOSES); if (n !== f.nose) f.nose = n; }
  if (stage >= 3 && R() < 0.14) { const n = R() < 0.5 ? 'marks' : 'fluff'; if (n !== f.cheeks) { f.cheeks = n; say(1, n === 'marks' ? 'Face paint markings' : 'Fluffy cheeks'); } }

  // arms: most pets have grown some by their third stage
  if (f.arms.t === 'none' && stage >= 2 && R() < (stage >= 3 ? 0.7 : 0.45)) { f.arms.t = R() < 0.6 ? 'nub' : 'paw'; say(3, ARM_WORD[f.arms.t]); }
  else if (P(0.42)) { const n = nxt('arms', f.arms.t); if (n !== f.arms.t) { f.arms.t = n; say(3, ARM_WORD[n] || 'New arms'); } }
  else if (f.arms.t !== 'none') f.arms.size = r1(clamp(f.arms.size * (1.05 + R() * 0.1), 0.8, 1.5));

  // legs: stubby feet turn into real legs as it grows up
  if (stage >= 5 && R() < 0.04 && f.legs.t !== 'float') { f.legs.t = 'float'; say(5, LEG_WORD.float); }
  else if (f.legs.t === 'nub' && stage >= 3 && R() < 0.65) { f.legs.t = wkey(R, [['paw', 34], ['stump', 24], ['boots', 16], ['hoof', 12], ['webbed', 14]]); say(3, LEG_WORD[f.legs.t]); }
  else if (P(0.42)) { const n = nxt('legs', f.legs.t); if (n !== f.legs.t) { f.legs.t = n; say(3, LEG_WORD[n]); } }
  const ll = LEG_LEN[f.legs.t];
  const before = f.legs.len;
  f.legs.len = r1(clamp(Math.max(f.legs.len, ll[0]) + (stage >= 4 ? 1 + R() * 1.5 : 0.5 + R()), ll[0], ll[1]));
  if (f.legs.len - before > 4 && f.legs.t !== 'float') say(1, 'Legs grew longer');

  // tail
  if (P(0.5)) { const n = nxt('tail', f.tail.t); if (n !== f.tail.t) { f.tail.t = n; say(3, n === 'none' ? 'Lost its tail' : `Tail turned into ${TAIL_WORD[n]}`); } }
  else if (f.tail.t !== 'none') f.tail.size = r1(clamp(f.tail.size * (1.06 + R() * 0.12), 0.8, 1.6));

  // colour
  const p0 = f.pal;
  if (p0.id === 'hue' && R() < 0.22) {
    const q = huePal(p0.h + (R() < 0.5 ? -1 : 1) * (12 + R() * 18), p0.s + R() * 8 - 4, p0.l + R() * 6 - 3, R);
    q.iris = p0.iris; f.pal = q; say(2, `Coat shifted to ${q.name.toLowerCase()}`);
  }
  if (stage >= 4 && !f.pal.accent && R() < 0.25) {
    const [h, s, l] = hex2hsl(f.pal.base);
    f.pal = Object.assign({}, f.pal, { sec: hsl2hex(h + 150 + R() * 60, Math.max(45, s), clamp(l - 8, 38, 72)), accent: true }); say(2, 'New accent colours');
  }
  if (stage >= 6 && !f.pal.grad && R() < 0.18) { f.pal = Object.assign({}, f.pal, { grad: [f.pal.lt, f.pal.base, f.pal.dk] }); say(3, 'Coat now shimmers'); }
  if (stage === 7 && R() < 0.06 && f.pal.id !== 'galaxy') { const sp = Object.assign({}, SPECIAL_PALS[R() < 0.5 ? 0 : 1]); delete sp.w; sp.iris = f.pal.iris; f.pal = sp; say(5, 'Coat turned cosmic'); }

  // extra features for each stage
  if (stage === 2) {
    X.gem = R() < 0.72 ? 'head' : 'chest';
    const k = wkey(R, [['top', 45], ['bud', 20], ['crestS', 15], ['fluff', 20]]);
    if (k === 'top' && !X.top) { X.top = wkey(R, [['tuft', 40], ['sprout', 30], ['curl', 30]]); say(4, { tuft: 'Sprouted a tuft of hair', sprout: 'A little sprout grew on its head', curl: 'Grew a curly cowlick' }[X.top]); }
    else if (k === 'bud') { X.bud = true; say(4, 'Tiny horn buds appeared'); }
    else if (k === 'crestS') { X.crest = { t: 'spike', size: 0.7 }; say(4, 'A little crest of spikes'); }
    else { f.cheeks = 'fluff'; say(4, 'Grew fluffy cheeks'); }
  }
  if (stage === 3) {
    const k = wkey(R, [['ruff', 30], ['crest', 20], ['spikes', 20], ['lion', 12], ['top', 18]]);
    if (k === 'ruff') { X.mane = 'ruff'; say(4, 'A fluffy ruff around its neck'); }
    else if (k === 'lion') { X.mane = 'lion'; say(5, 'A grand mane'); }
    else if (k === 'crest') { X.crest = { t: wkey(R, [['spike', 40], ['feather', 35], ['flame', 25]]), size: 1 }; say(4, `A ${X.crest.t === 'feather' ? 'feathered' : X.crest.t === 'flame' ? 'fiery' : 'spiky'} crest`); }
    else if (k === 'spikes') { X.spikes = true; say(4, 'Spikes along its back'); }
    else if (!X.top) { X.top = wkey(R, [['tuft', 40], ['sprout', 30], ['curl', 30]]); say(4, 'Sprouted a tuft on top'); }
    else { X.spikes = true; say(4, 'Spikes along its back'); }
  }
  if (stage === 4) {
    delete X.bud;
    let t = wkey(R, [['goat', 14], ['ram', 12], ['uni', 12], ['devil', 12], ['bull', 10], ['crystal', 14], ['antlers', 14]]);
    if (f.ears.t === 'ram' && t === 'ram') t = 'goat';
    X.horns = { t, size: r1(0.9 + R() * 0.3) };
    say(5, HORN_WORD[t]);
  }
  if (stage === 5) {
    const bias = { feather: 24, bat: 18, fairy: 16, butterfly: 12, leaf: 8, cloud: 10, crystal: 7, flame: 5 };
    const et = f.ears.t, tt = f.tail.t;
    if (et === 'bat' || et === 'lynx' || tt === 'devil') bias.bat *= 3;
    if (et === 'leaf' || et === 'bloom' || tt === 'leaf') bias.leaf *= 4;
    if (et === 'flame' || tt === 'flame') bias.flame *= 4;
    if (et === 'crystal' || tt === 'crystal' || (X.horns && X.horns.t === 'crystal')) bias.crystal *= 4;
    if (et === 'feather' || tt === 'feather') bias.feather *= 3;
    if (et === 'fin' || tt === 'fish') bias.fairy *= 2;
    const t = wkey(R, Object.entries(bias));
    if (!X.gold) { X.wings = { t, size: r1(0.9 + R() * 0.2), n: 1 }; say(6, WING_WORD[t]); }
    const k5 = R();
    if (k5 < 0.4) { X.pauldrons = true; say(4, 'Shoulder pauldrons of crystal'); }
    else if (k5 < 0.7 && X.horns) { X.horns2 = { t: secondHorn(X.horns.t, R), size: r1(0.65 + R() * 0.2) }; say(4, 'A second set of horns'); }
    else if (k5 < 0.85 && !X.orbs) { X.orbs = 3; say(4, 'Orbs of light circle around it'); }
  }
  if (stage === 6) {
    if (X.wings && R() < 0.45) { X.wings.n = 2; say(6, 'A second pair of wings!'); }
    else if (X.wings) { X.wings.size = r1(Math.min(WING_CAP, X.wings.size * 1.12)); say(1, 'Wings grew bigger'); }
    const k = wkey(R, [['marks', 30], ['armor', 25], ['orbs', X.orbs ? 5 : 22], ['tail', 20], ['horns2', X.horns && !X.horns2 ? 22 : 0], ['pauldrons', X.pauldrons ? 0 : 18]]);
    if (k === 'tail' && MULTI_TAIL.includes(f.tail.t)) { f.tail.n = 2; say(5, 'Grew a second tail!'); }
    else if (k === 'armor') { X.armor = true; say(5, 'Grew crystal armour'); }
    else if (k === 'orbs') { X.orbs = X.orbs ? Math.min(6, X.orbs + 1) : 3; say(5, 'Orbs of light circle around it'); }
    else if (k === 'horns2') { X.horns2 = { t: secondHorn(X.horns.t, R), size: r1(0.65 + R() * 0.2) }; say(5, 'A second set of horns'); }
    else if (k === 'pauldrons') { X.pauldrons = true; say(5, 'Shoulder pauldrons of crystal'); }
    else { X.marks = wkey(R, [['chevron', 40], ['swirl', 30], ['lines', 30]]); say(5, 'Glowing marks appeared'); }
  }
  if (stage === 7) {
    X.aura = X.gold ? 'gold' : wkey(R, [['glow', 45], ['flame', 25], ['stars', 30]]);
    X.halo = X.gold ? 'crown' : wkey(R, [['ring', 40], ['crown', 30], ['stars', 30]]);
    say(6, { ring: 'A golden halo', crown: 'A crown of gold', stars: 'A crown of stars' }[X.halo]);
    say(5, { glow: 'A shining aura', flame: 'A blazing aura', stars: 'A starry aura', gold: 'Its aura blazes brighter' }[X.aura]);
    if (X.wings && X.wings.n >= 2 && (X.gold || R() < 0.4)) { X.wings.n = 3; say(6, 'A third pair of wings!'); }
    else if (X.wings && X.wings.n < 2 && R() < 0.6) { X.wings.n = 2; say(6, 'A second pair of wings!'); }
    else if (X.wings) X.wings.size = r1(Math.min(WING_CAP, X.wings.size * 1.08));
    if (f.tail.n === 2 && R() < 0.3) { f.tail.n = 3; say(5, 'A third tail!'); }
    if (!X.armor && R() < 0.45) { X.armor = true; say(5, 'Grew crystal armour'); }
    if (!X.pauldrons && R() < 0.45) { X.pauldrons = true; say(4, 'Shoulder pauldrons of crystal'); }
    if (X.horns && !X.horns2 && R() < 0.35) { X.horns2 = { t: secondHorn(X.horns.t, R), size: r1(0.65 + R() * 0.2) }; say(4, 'A second set of horns'); }
    if (X.orbs) X.orbs = Math.min(6, X.orbs + 2); else if (R() < 0.35) X.orbs = 4;
  }
  // a Legendary grows by its own rules (wings, lights, halo, armour), and stays cute
  if (X.gold) {
    if (!CUTE_EYES.includes(f.eyes.t)) { f.eyes.t = prev.eyes.t; f.eyes.iris2 = prev.eyes.iris2; for (let i = ch.length - 1; i >= 0; i--) if (/^Eyes became/.test(ch[i][1]) || Object.values(EYE_MUT).includes(ch[i][1])) ch.splice(i, 1); }
    if (!CUTE_MOUTHS.includes(f.mouth)) { f.mouth = prev.mouth; for (let i = ch.length - 1; i >= 0; i--) if (Object.values(MOUTH_WORD).includes(ch[i][1])) ch.splice(i, 1); }
    f.eyes.size = r1(Math.max(f.eyes.size, 1.08));
    if (f.mouth !== 'beak' && f.nose === 'none' && prev.nose !== 'none') f.nose = prev.nose;
    for (let i = ch.length - 1; i >= 0; i--) if (/wings|Orbs of light|armour|pauldrons|A golden halo/i.test(ch[i][1])) ch.splice(i, 1);
    legendStage(f, stage, say, prev.x || {});
  }
  ch.sort((a, b2) => b2[0] - a[0]);
  return { form: f, changes: ch.map(c => c[1]) };
}
/* a whole line of forms from a hatchling: used by dev tools and the design lab */
function evolveLine(base, toStage, R) {
  const out = [base];
  for (let s = base.stage + 1; s <= toStage; s++) out.push(evolveForm(out[out.length - 1], R, s).form);
  return out;
}

/* ---------- names, traits and rarity ---------- */
const NAME_PRE = {
  red: ['Ember', 'Cinder', 'Ruby'], orange: ['Amber', 'Tango', 'Copper'], yellow: ['Sun', 'Honey', 'Saffron'], lime: ['Sprig', 'Zest', 'Lime'],
  green: ['Moss', 'Fern', 'Clover'], teal: ['Tide', 'Reef', 'Lagoon'], blue: ['Sky', 'Frost', 'Brook'], indigo: ['Dusk', 'Azure', 'Indi'],
  purple: ['Plum', 'Mystic', 'Lilac'], pink: ['Rose', 'Petal', 'Bloom'], white: ['Pearl', 'Snow', 'Cloud'], dark: ['Shade', 'Onyx', 'Night'],
  gray: ['Ash', 'Pebble', 'Smoke'], galaxy: ['Cosmo', 'Nebula', 'Astro'], aurora: ['Aura', 'Glimmer', 'Halo'], sunset: ['Dawn', 'Blaze', 'Glow'],
  ocean: ['Marina', 'Abyss', 'Wave'], gold: ['Gilt', 'Aurum', 'Gold'], prism: ['Prism', 'Opal', 'Gleam'], shadow: ['Umbra', 'Shade', 'Gloom'], snow: ['Snow', 'Frost', 'Flurry'],
};
function hueFamily(p) {
  if (NAME_PRE[p.id]) return p.id;
  const [h, s, l] = hex2hsl(p.base);
  if (l > 86 && s < 40) return 'white';
  if (l < 34) return 'dark';
  if (s < 24) return 'gray';
  const fam = [[14, 'red'], [38, 'orange'], [62, 'yellow'], [85, 'lime'], [150, 'green'], [190, 'teal'], [230, 'blue'], [258, 'indigo'], [292, 'purple'], [345, 'pink'], [361, 'red']];
  for (const [lim, n] of fam) if (h < lim) return n;
  return 'red';
}
const CORE = {
  wings: { feather: 'wing', bat: 'drake', fairy: 'sprite', butterfly: 'flutter', leaf: 'frond', cloud: 'puff', crystal: 'shard', flame: 'flare' },
  horns: { goat: 'buck', ram: 'ram', uni: 'horn', devil: 'imp', bull: 'taur', crystal: 'gem', antlers: 'stag' },
  eyes: { cyclops: 'eye', triple: 'seer', quad: 'seer', compound: 'bug', glow: 'glow' },
  ears: { bunny: 'hop', lop: 'lop', cat: 'whisk', fox: 'fox', lynx: 'lynx', bat: 'bat', mouse: 'squeak', round: 'bun', nub: 'bun', fin: 'fin', antenna: 'zap', leaf: 'sprout', bloom: 'bloom', feather: 'owl', elf: 'elf', crystal: 'gem', flame: 'flare' },
  tail: { fox: 'brush', flame: 'flare', fish: 'fin', lizard: 'scale', devil: 'imp', curly: 'curl', star: 'star', bolt: 'bolt', feather: 'plume', ribbon: 'ribbon', crystal: 'gem', leaf: 'leaf', lion: 'mane', cat: 'tail', fluffy: 'fluff', puff: 'puff' },
  fur: { fluffy: 'fluff', woolly: 'wool', shaggy: 'shag', spiky: 'spike', scaly: 'scale', slime: 'goo', sleek: 'slick' },
};
function speciesName(f) {
  const fam = hueFamily(f.pal), pre = NAME_PRE[fam][f.seed % 3];
  const sg = f.stage || 1, X = f.x || {};
  if (sg <= 2) return pre + (sg === 1 ? ['let', 'kin', 'bit', 'pip'] : ['ling', 'kit', 'bud', 'pup'])[(f.seed >> 3) % 4];
  let core = null;
  if (sg >= 5 && X.wings) core = CORE.wings[X.wings.t];
  if (!core && sg >= 4 && X.horns) core = CORE.horns[X.horns.t];
  if (!core) core = CORE.eyes[f.eyes.t] || CORE.ears[f.ears.t] || CORE.tail[f.tail.t] || CORE.fur[f.body.fur] || ['puff', 'bean', 'mochi', 'blob'][f.seed % 4];
  if (pre.toLowerCase().endsWith(core.charAt(0))) core = core.slice(1);
  const name = pre + core;
  return sg === 7 ? ['Astral', 'Celestial', 'Starborn', 'Eternal'][(f.seed >> 5) % 4] + ' ' + name : name;
}
function traitParts(f) {
  const out = [];
  const p = f.pal;
  out.push({ label: p.name + ' coat', r: p.r || 0 });
  const add = (cat, id, skip) => { if (id !== skip) out.push({ label: tname(cat, id), r: trar(cat, id) }); };
  add('fur', f.body.fur, 'smooth'); add('pattern', f.pattern, 'plain'); add('eyes', f.eyes.t); add('ears', f.ears.t);
  add('mouth', f.mouth); add('nose', f.nose, 'none'); add('cheeks', f.cheeks, 'blush');
  add('arms', f.arms.t, 'none'); add('legs', f.legs.t, 'nub'); add('tail', f.tail.t);
  const X = f.x || {};
  if (X.horns) out.push({ label: HORN_WORD[X.horns.t].replace(/^Grew (a |an )?/, '').replace(/^./, c => c.toUpperCase()), r: 2 });
  if (X.wings) out.push({ label: X.gold && X.leg ? ({ dragon: 'Dragon wings', butterfly: 'Butterfly wings', dragonfly: 'Dragonfly wings', crystal: 'Crystal wings' }[X.leg.w] || 'Angel wings') : tname('wings', X.wings.t), r: 2 });
  if (X.wings && X.wings.n > 1) out.push({ label: ['', '', 'Two', 'Three', 'Four'][X.wings.n] + ' pairs of wings', r: 3 });
  if (X.lights) out.push({ label: 'Orbiting lights', r: 3 });
  if (X.horns2) out.push({ label: 'Twin horns', r: 3 });
  if (X.pauldrons) out.push({ label: 'Pauldrons', r: 2 });
  if (X.armor) out.push({ label: 'Crystal armour', r: 2 });
  if (f.tail.n > 1) out.push({ label: f.tail.n === 2 ? 'Two tails' : 'Three tails', r: 3 });
  if (X.forged && !X.gold) out.unshift({ label: 'Star-forged', r: RANK_R[X.rank] ? RANK_R[X.rank][0] : 2 });
  if (X.gold) out.unshift({ label: 'Legendary', r: 5 });
  return out;
}
CAT.wings = [G('feather', 'Feathered wings'), G('bat', 'Bat wings'), G('fairy', 'Fairy wings'), G('butterfly', 'Butterfly wings'), G('leaf', 'Leaf wings'), G('cloud', 'Cloud wings'), G('crystal', 'Crystal wings'), G('flame', 'Flame wings')];
/* a fused pet's star rank is fixed at fusion (x.rank): its traits still say how rare it is within that rank */
const RANK_R = { 3: [0, 1], 4: [2, 2], 5: [3, 4] };
function rarityOf(f) {
  const rs = traitParts(f).map(t => t.r);
  let top = Math.max(...rs);
  if (top < 3 && rs.filter(r => r >= 2).length >= 3) top += 1;
  const X = f.x || {};
  if (X.gold) return 5;
  if (RANK_R[X.rank]) return clamp(top, RANK_R[X.rank][0], RANK_R[X.rank][1]);
  return clamp(top, 0, 5);
}
/* ---------- six-star Legendaries ----------
   A Legendary (x.gold) is cute (sparkling eyes, a sweet mouth), wears colours all its own (x.leg: angel or dragon
   wings, their colour and the colour of their tips or bones, and the colour of its light), and grows by stage: small
   wings at first that grow with every stage, more pairs of the same wings as it evolves (the main pair always the
   biggest), two lights circling it from Baby on, a halo at Junior, pauldrons at Guardian, armour at Mythic and a
   crown at Celestial. Its radiant aura is with it from the start */
const CUTE_EYES = ['round', 'big', 'sparkle', 'star', 'heart', 'button', 'oval', 'cat', 'hetero'];
const CUTE_MOUTHS = ['smile', 'cat', 'blep', 'o', 'fang'];
const LEG_WS = [0, 0.6, 0.66, 0.74, 0.83, 0.93, 1.04, 1.15];   // its wings' size at each stage
const LEG_PAIRS = [0, 1, 1, 2, 2, 3, 3, 4];                    // and how many pairs (a third at Guardian, a fourth, the smallest and still, at Celestial)
/* the kinds of a six-star's wings: angel (feathers), dragon (membrane), butterfly (a forewing and a hindwing, plainer
   and smaller when young, at Celestial great panes with points, tails and filigree) and dragonfly (clear blades veined
   in a net; six or eight at Celestial) and crystal (faceted shards fanned like feathers, more and longer as it grows). And what it floats over at Celestial: the full magic circle, or a spinning ring
   of smooth light, of spiked metal, or of its element (fire, ice, water...) */
const LEG_KINDS = ['angel', 'dragon', 'butterfly', 'dragonfly', 'crystal'], LEG_RINGS = ['circle', 'light', 'metal', 'element'];
function makeLeg(R) {
  let w = R() < 0.5 ? 'angel' : 'dragon'; const h = R() * 360, h2 = h + (R() < 0.5 ? 1 : -1) * (35 + R() * 145), h3 = R() * 360;
  let a = w === 'angel' ? hsl2hex(h, 35 + R() * 50, 86 + R() * 8) : hsl2hex(h, 45 + R() * 45, 60 + R() * 14);
  let b = w === 'angel' ? hsl2hex(h2, 68 + R() * 27, 54 + R() * 14) : hsl2hex(h2, 50 + R() * 40, 32 + R() * 14);
  const c = hsl2hex(h3, 85 + R() * 15, 60 + R() * 12);
  // (the newer kinds drawn after the old ones, so a pet made from a seed before them keeps its colours)
  const q = R(), out = { w, a, b, c };
  if (q < 0.48) {
    out.w = w = q < 0.17 ? 'butterfly' : q < 0.33 ? 'dragonfly' : 'crystal';
    if (w === 'butterfly') { out.a = hsl2hex(h, 40 + R() * 50, 78 + R() * 14); out.b = hsl2hex(h2, 45 + R() * 45, 22 + R() * 22); out.n7 = R() < 0.5 ? 3 : 4; }
    else if (w === 'crystal') { out.a = hsl2hex(h, 55 + R() * 40, 70 + R() * 14); out.b = hsl2hex(h + (R() - 0.5) * 40, 55 + R() * 40, 30 + R() * 16); }
    else { out.a = hsl2hex(h, 30 + R() * 50, 80 + R() * 12); out.b = hsl2hex(h2, 35 + R() * 40, 20 + R() * 20); out.n7 = R() < 0.5 ? 3 : 4; }
    out.v = Math.round(R() * 100) / 100;   // its own shape: longer or rounder, more or fewer veins
  }
  out.ring = wkey(R, [['circle', 30], ['light', 25], ['metal', 20], ['element', 25]]);
  return out;
}
// how many pairs of wings a six-star has at a stage: a butterfly one great pair, from Guardian swallowtails tucked
// in below it (six or eight wings at Celestial); crystal a third, smaller pair below at Celestial; a dragonfly one, then two, at Celestial
// three or four (six or eight wings); crystal one, a second from Guardian; angels and dragons one more every two stages, four at Celestial
const legPairs = (L, sg) => L && L.w === 'butterfly' ? (sg >= 5 ? 2 : 1) : L && L.w === 'crystal' ? (sg >= 7 ? 3 : sg >= 5 ? 2 : 1) : L && L.w === 'dragonfly' ? (sg >= 7 ? (L.n7 === 4 ? 4 : 3) : sg >= 4 ? 2 : 1) : LEG_PAIRS[sg];
// a summoned Legendary's coat: any colour at all, and a cute face
function legendCoat(f, R) {
  const q = huePal(R() * 360, 30 + R() * 62, 48 + R() * 36, R); q.iris = hsl2hex(R() * 360, 70 + R() * 20, 42 + R() * 14);
  if (R() < 0.3) q.grad = [q.lt, q.base, q.dk];
  f.pal = q;
  f.eyes.t = wkey(R, [['sparkle', 30], ['big', 24], ['star', 14], ['heart', 10], ['round', 10], ['hetero', 8], ['cat', 4]]);
  if (f.eyes.t === 'hetero') f.eyes.iris2 = hsl2hex(R() * 360, 75, 50);
  f.eyes.size = r1(Math.max(f.eyes.size, 1.1 + R() * 0.15));
  f.mouth = wkey(R, [['cat', 34], ['smile', 30], ['blep', 20], ['fang', 16]]);
  if (f.nose === 'snout' || f.nose === 'muzzle') f.nose = R() < 0.5 ? 'tri' : 'heart';
  f.cheeks = wkey(R, [['blush', 62], ['dots', 20], ['swirl', 18]]);
  return f;
}
// what a Legendary has at a stage (while evolving, say tells what is new since px, the stage before's features)
function legendStage(f, sg, say, px) {
  const X = f.x || (f.x = {}), L = X.leg, P = px || {}, tell = say || (() => {});
  X.gold = 1; X.aura = 'gold';
  const t = L && L.w === 'dragon' ? 'bat' : L && L.w === 'butterfly' ? 'butterfly' : L && L.w === 'dragonfly' ? 'fairy' : L && L.w === 'crystal' ? 'crystal' : 'feather', n0 = P.wings ? P.wings.n || 1 : 0, s0 = P.wings ? P.wings.size || 0 : 0;
  X.wings = { t, size: clamp(r1(LEG_WS[sg]), 0.6, WING_CAP), n: legPairs(L, sg) }; delete X.wings2;
  if (L && L.w === 'butterfly' && sg === 7 && say) tell(6, 'Its wings open into great jewelled panes');
  if (X.wings.n > n0) tell(6, ['', '', 'A second', 'A third', 'A fourth'][X.wings.n] + ' pair of wings!'); else if (X.wings.size > s0) tell(4, 'Its wings grew bigger');
  if (sg >= 2) { if (!P.lights) tell(6, 'Two lights circle around it'); X.lights = 2; } else delete X.lights;
  // (and at Celestial two more swirl round it the other way, on a ring tilted against the first)
  if (sg >= 7) { if ((P.lights || 0) < 4) tell(6, 'Two more lights swirl around it'); X.lights = 4; }
  delete X.orbs;
  if (sg >= 3 && !X.halo) X.halo = 'ring';
  if (sg >= 3 && sg < 7 && !P.halo) tell(5, 'A shining halo');
  if (sg >= 5) { if (!P.pauldrons) tell(4, 'Shining pauldrons'); X.pauldrons = true; }
  if (sg >= 6) { if (!P.armor) tell(5, 'Shining armour'); X.armor = true; }
  if (sg >= 7) X.halo = 'crown';
  return f;
}
/* turning a form Legendary (by summoning or fusion). leg: its colours, shared by all its forms */
function gildForm(f, R, leg) {
  R = R || Math.random; const X = f.x || (f.x = {});
  X.leg = leg || X.leg || makeLeg(R);
  delete X.rank; delete X.forged;
  if (!CUTE_EYES.includes(f.eyes.t)) f.eyes.t = wkey(R, [['sparkle', 40], ['big', 35], ['star', 25]]);
  if (!CUTE_MOUTHS.includes(f.mouth)) f.mouth = R() < 0.5 ? 'cat' : 'smile';
  f.eyes.size = r1(Math.max(f.eyes.size, 1.08));
  return legendStage(f, f.stage || 1);
}
function gildPet(p, R) { R = R || Math.random; const leg = makeLeg(R), e = wkey(R, [['sparkle', 40], ['big', 35], ['star', 25]]), m = R() < 0.5 ? 'cat' : 'smile';
  (p.forms || []).forEach(f => { if (!CUTE_EYES.includes(f.eyes.t)) f.eyes.t = e; if (!CUTE_MOUTHS.includes(f.mouth)) f.mouth = m; gildForm(f, R, leg); }); p.rarity = 5; return p; }
// a Legendary loaded from an older version (golden, before colours of its own): the same colours on every form, from its seed
/* how big a Legendary stands in the room: it grows 5 to 10% with every evolution (its own amounts, from its seed),
   counting what its body grows in the picture too, so stage over stage the whole pet is that much bigger. Ordinary
   pets stop growing at Guardian; a Legendary keeps going */
// the highest point of a path of M, L, Q and C (absolute), its curves sampled
function pathTop(d) {
  let top = 0, cx = 0, cy = 0; const re = /([MLQCZ])([^MLQCZ]*)/g; let m;
  while ((m = re.exec(d))) {
    const n = (m[2].match(/-?\d+(?:\.\d+)?/g) || []).map(Number), c = m[1];
    if (c === 'M' || c === 'L') { cx = n[0]; cy = n[1]; top = Math.min(top, cy); }
    else if (c === 'Q') { for (let t = 0.25; t <= 1; t += 0.25) { const u = 1 - t; top = Math.min(top, u * u * cy + 2 * u * t * n[1] + t * t * n[3]); } cx = n[2]; cy = n[3]; }
    else if (c === 'C') { for (let t = 0.125; t <= 1; t += 0.125) { const u = 1 - t; top = Math.min(top, u * u * u * cy + 3 * u * u * t * n[1] + 3 * u * t * t * n[3] + t * t * t * n[5]); } cx = n[4]; cy = n[5]; }
  }
  return top;
}
const LEG_SCALES = new WeakMap();   // (worked out once for each pet and stage: the room asks every frame)
function legScale(p) {
  const c = LEG_SCALES.get(p);
  if (c && c.st === p.stage && c.fs === p.forms && c.n === (p.forms || []).length) return c.v;
  const v = legScaleOf(p); LEG_SCALES.set(p, { st: p.stage, fs: p.forms, n: (p.forms || []).length, v }); return v;
}
function legScaleOf(p) {
  const fs = p.forms || [], f1 = fs[0], fn = fs[Math.min(fs.length, p.stage || 1) - 1] || f1;
  if (!f1 || !fn || !(fn.x && fn.x.gold)) return null;
  // (the body's height as drawn: the tallest point of its outline, fur and all, above the floor)
  const hOf = f => { const g = petGeom(f); return -Math.min(g.top, pathTop(furPath(g, f.body.fur, mulberry32(f.seed || 1)))); }, R = mulberry32(((p.dna && p.dna.seed || 1) ^ 0x51A7E5) >>> 0);
  let g = 1; for (let s = 2; s <= (fn.stage || 1); s++) g *= 1.05 + R() * 0.05;
  return STAGES[1].scale * (f1.grow || 1) * g * hOf(f1) / hOf(fn);
}
function legendFix(p) {
  const fs = p && p.forms; if (!fs || !fs.some(f => f.x && f.x.gold)) return p;
  const leg = (fs.find(f => f.x && f.x.leg) || {}).x;
  const L = leg ? leg.leg : makeLeg(mulberry32(((p.dna && p.dna.seed || 1) ^ 0x6E6E9D) >>> 0));
  fs.forEach(f => { if (!f.x) f.x = {}; if (f.x.gold) { f.x.leg = L; legendStage(f, f.stage || 1); } });
  return p;
}
const traitList = f => traitParts(f);
function dnaCode(f) {
  const s = JSON.stringify(f);
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13); }
  const hx = v => (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return hx(h1).slice(0, 4) + '-' + hx(h2).slice(0, 4);
}

/* ---------- loading: keep stored forms safe ---------- */
const HEX = /^#[0-9a-fA-F]{6}$/;
function cleanPal(p) {
  if (!p || typeof p !== 'object') return null;
  const keys = ['base', 'dk', 'lt', 'belly', 'sec', 'inner', 'cheek', 'iris'];
  for (const k of keys) if (!HEX.test(p[k])) return null;
  const q = {};
  keys.forEach(k => { q[k] = p[k]; });
  q.id = typeof p.id === 'string' && /^[a-z]{2,10}$/.test(p.id) ? p.id : 'hue';
  q.name = typeof p.name === 'string' ? p.name.replace(/[^A-Za-z ]/g, '').slice(0, 18) || 'Coat' : 'Coat';
  q.r = clamp(Math.round(+p.r || 0), 0, 4);
  ['h', 's', 'l'].forEach(k => { if (typeof p[k] === 'number' && isFinite(p[k])) q[k] = p[k]; });
  if (Array.isArray(p.grad) && p.grad.length >= 2 && p.grad.length <= 4 && p.grad.every(c => HEX.test(c))) q.grad = p.grad.slice();
  if (p.stars) q.stars = true;
  if (p.shine) q.shine = true;
  if (p.accent) q.accent = true;
  return q;
}
function cleanForm(f) {
  if (!f || typeof f !== 'object' || f.v !== 3) return null;
  const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v)) ? clamp(v, lo, hi) : d;
  const id = (cat, v, d) => CAT[cat].some(o => o.id === v) ? v : d;
  const pal = cleanPal(f.pal);
  const b = f.body || {}, e = f.eyes || {}, X = f.x || {};
  if (!pal) return null;
  const sg = Math.round(num(f.stage, 1, 7, 1));
  const out = {
    v: 3, seed: Math.floor(num(f.seed, 1, 2e9, 1)), stage: sg, grow: num(f.grow, 0.85, sg >= 5 ? GROW_CAP_LATE : GROW_CAP, 1),
    body: { h: num(b.h, 60, 110, 82), w: num(b.w, 30, 56, 44), headW: num(b.headW, 0.7, 1.2, 1), top: num(b.top, 0, 1, 0.6), flat: num(b.flat, 0, 1, 0.5), waist: num(b.waist, 0, 0.5, 0), fur: id('fur', b.fur, 'smooth'), belly: id('belly', b.belly, 'oval') },
    pal, pattern: id('pattern', f.pattern, 'plain'),
    eyes: { t: id('eyes', e.t, 'round'), size: num(e.size, 0.6, 1.5, 1), gap: num(e.gap, 0.24, 0.46, 0.34), iris2: HEX.test(e.iris2) ? e.iris2 : '#4FA8F0' },
    mouth: id('mouth', f.mouth, 'smile'), nose: id('nose', f.nose, 'none'), cheeks: id('cheeks', f.cheeks, 'blush'),
    ears: { t: id('ears', f.ears && f.ears.t, 'round'), size: num(f.ears && f.ears.size, 0.6, 1.7, 1) },
    arms: { t: id('arms', f.arms && f.arms.t, 'none'), size: num(f.arms && f.arms.size, 0.7, 1.6, 1) },
    legs: (() => { const t0 = id('legs', f.legs && f.legs.t, 'nub'), t = LEG_ALIAS[t0] || t0, ll = LEG_LEN[t] || [0, 4]; return { t, len: clamp(num(f.legs && f.legs.len, 0, 30, 0), ll[0], ll[1]), size: num(f.legs && f.legs.size, 0.8, 1.3, 1) }; })(),
    tail: { t: id('tail', f.tail && f.tail.t, 'none'), size: num(f.tail && f.tail.size, 0.6, 1.7, 1), n: Math.round(num(f.tail && f.tail.n, 1, 3, 1)) },
    x: {},
  };
  const oneOf = (v, list) => list.includes(v) ? v : null;
  const ox = out.x;
  if (oneOf(X.gem, ['head', 'chest'])) ox.gem = X.gem;
  if (oneOf(X.top, ['tuft', 'sprout', 'curl'])) ox.top = X.top;
  if (X.bud) ox.bud = true;
  if (X.crest && oneOf(X.crest.t, ['spike', 'feather', 'flame'])) ox.crest = { t: X.crest.t, size: num(X.crest.size, 0.5, 1.4, 1) };
  if (X.spikes) ox.spikes = true;
  if (oneOf(X.mane, ['ruff', 'lion'])) ox.mane = X.mane;
  if (X.horns && oneOf(X.horns.t, Object.keys(HORN_WORD))) ox.horns = { t: X.horns.t, size: num(X.horns.size, 0.6, 1.5, 1) };
  if (ox.horns && X.horns2 && oneOf(X.horns2.t, Object.keys(HORN_WORD)) && X.horns2.t !== 'uni' && X.horns2.t !== 'antlers') ox.horns2 = { t: X.horns2.t, size: num(X.horns2.size, 0.5, 1.2, 0.75) };
  if (X.wings && oneOf(X.wings.t, Object.keys(WING_WORD))) ox.wings = { t: X.wings.t, size: num(X.wings.size, 0.6, WING_CAP, 1), n: Math.round(num(X.wings.n, 1, X.gold ? 4 : 3, 1)) };
  if (ox.wings && ox.wings.n > 1 && oneOf(X.wings2, Object.keys(WING_WORD)) && X.wings2 !== ox.wings.t) ox.wings2 = X.wings2;
  if (oneOf(X.marks, ['chevron', 'swirl', 'lines'])) ox.marks = X.marks;
  if (X.armor) ox.armor = true;
  if (X.pauldrons) ox.pauldrons = true;
  if (X.orbs) ox.orbs = Math.round(num(X.orbs, 3, 6, 3));
  if (oneOf(X.aura, ['glow', 'flame', 'stars', 'gold'])) ox.aura = X.aura;
  if (X.gold) ox.gold = 1;
  if (X.gold && X.leg && oneOf(X.leg.w, LEG_KINDS) && ['a', 'b', 'c'].every(k => HEX.test(X.leg[k]))) {
    ox.leg = { w: X.leg.w, a: X.leg.a, b: X.leg.b, c: X.leg.c };
    if (oneOf(X.leg.ring, LEG_RINGS)) ox.leg.ring = X.leg.ring;
    if (X.leg.w === 'dragonfly' || X.leg.w === 'butterfly') ox.leg.n7 = X.leg.n7 === 4 ? 4 : 3;
    if (X.leg.v != null) ox.leg.v = num(X.leg.v, 0, 1, 0.5);
  }
  if (X.gold && X.lights) ox.lights = X.lights >= 4 ? 4 : 2;
  if (RANK_R[X.rank]) ox.rank = X.rank;
  if (X.forged && ox.rank) ox.forged = 1;
  if (oneOf(X.halo, ['ring', 'crown', 'stars'])) ox.halo = X.halo;
  return out;
}

/* ---------- pets from older versions keep their look ---------- */
const LEGACY_PAL = {
  apricot: ['Apricot', 0, '#F6AE6A', '#D9884A', '#FFE9D2', '#E07B39'], bubblegum: ['Bubblegum', 0, '#F4A1C6', '#D57DA6', '#FFE7F2', '#E36FA5', '#FF6F91'],
  lavender: ['Lavender', 0, '#B8A3F2', '#937FD6', '#F0EAFF', '#8C6FE0'], sky: ['Sky', 0, '#85C6F1', '#5DA4D4', '#E6F4FF', '#4C93D1'],
  cocoa: ['Cocoa', 0, '#BF906B', '#986A4A', '#F6E7D9', '#8A5B3C'], snow: ['Snow', 0, '#F4F2ED', '#CFCAC0', '#FFFFFF', '#B9B2A6'],
  mint: ['Mint', 0, '#8FD9B6', '#5FB592', '#EDFFF6', '#4FA582'], lemon: ['Lemon', 0, '#F7DC6F', '#D9B940', '#FFF8DC', '#E3A93C'],
  peach: ['Peach Melba', 1, '#F9BCA4', '#DE957C', '#FFF1EA', '#8FD9B6'], charcoal: ['Charcoal', 1, '#7A7682', '#55515C', '#E2DEE8', '#46424D', '#FF9AB0', '#F2B8C6'],
  tomato: ['Tomato', 1, '#F2826F', '#CF5E4D', '#FFE5DF', '#C9473A'], teal: ['Lagoon', 1, '#62C9C3', '#3FA19C', '#E3FAF8', '#2E8A86'],
};
function legacyPal(id, R) {
  const sp = SPECIAL_PALS.find(p => p.id === id);
  if (sp) { const p = Object.assign({}, sp); delete p.w; return p; }
  const L = LEGACY_PAL[id] || LEGACY_PAL.apricot;
  const [h, s, l] = hex2hsl(L[2]);
  return { id: 'hue', name: L[0], r: L[1], h: r1(h), s: r1(s), l: r1(l), base: L[2], dk: L[3], lt: hsl2hex(h, s - 8, l + 11), belly: L[4], sec: L[5], inner: L[7] || '#FFAFBE', cheek: L[6] || '#FF8FA3', iris: hsl2hex(R() * 360, 68, 46) };
}
function formFromLegacy(d) {
  const R = mulberry32((d && d.seed) || 7);
  const f = makeForm(R);
  if (!d || typeof d !== 'object') return f;
  f.seed = Math.floor(+d.seed) || f.seed;
  f.pal = legacyPal(d.palette, R);
  const BODY = { round: [88, 46, 1, 0.6, 0.5], bean: [96, 41, 0.96, 0.7, 0.45], pear: [86, 44, 0.84, 0.6, 0.7], squish: [80, 50, 1, 0.8, 0.6], drop: [96, 44, 0.9, 0.05, 0.5] };
  const bb = BODY[d.body] || BODY.round;
  Object.assign(f.body, { h: bb[0], w: bb[1], headW: bb[2], top: bb[3], flat: bb[4], waist: 0, fur: 'smooth', belly: 'oval' });
  f.ears = { t: { cat: 'cat', bear: 'round', lop: 'lop', antenna: 'antenna', leaf: 'leaf', none: 'none', fin: 'fin', horn: 'none' }[d.ears] || 'cat', size: 1 };
  if (d.ears === 'horn') f.x.bud = true;
  f.tail = { t: { fluffy: 'fluffy', curly: 'curly', puff: 'puff', tuft: 'lion', none: 'none', fish: 'fish', spiky: 'lizard' }[d.tail] || 'fluffy', size: 1, n: 1 };
  f.pattern = ['plain', 'spots', 'stripes', 'socks', 'cap', 'mask', 'patch'].includes(d.pattern) ? d.pattern : 'plain';
  f.eyes = { t: ['round', 'dot', 'big', 'sparkle', 'sleepy', 'hetero'].includes(d.eyes) ? d.eyes : 'round', size: 1.12, gap: 0.33, iris2: '#4FA8F0' };
  if (d.quirk === 'starry') f.eyes.t = 'star';
  f.mouth = { w: 'cat', u: 'smile', blep: 'blep' }[d.mouth] || 'cat';
  f.nose = 'none';
  f.cheeks = d.quirk === 'freckles' ? 'freckles' : 'blush';
  if (d.quirk === 'sprout') f.x.top = 'sprout';
  f.arms = { t: 'none', size: 1 };
  f.legs = { t: 'nub', len: 0, size: 1 };
  f.grow = clamp(+d.size || 1, 0.9, 1.1);
  return f;
}
