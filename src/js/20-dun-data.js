/* ---------- the Dungeon: lands, monsters, elite affixes, bosses, shrines, power stones and how hard each floor is ---------- */
/* tile types */
const T_SOLID = 0, T_FLOOR = 1, T_GAP = 2, T_MUD = 3, T_ICE = 4, T_BRIDGE = 5;
const T_WALK = [0, 1, 0, 1, 1, 1];   // can you stand on it?

/* sixteen lands. "out" lands are open air: the space between places is water, sky, lava or void instead of rock */
const BIOMES = {
  halls: { name: 'Mossy Halls', out: false, dark: 0.8, bg: '#0B0916', gap: 'pit', ambient: 'dust', accent: '#8FE0A6', light: '#FF9F43',
    floor: ['#4A4566', '#514B6F', '#47425F'], grout: '#363150', hi: '#6B6491', top: '#6A6194', face: '#3A3458', faceD: '#2A2541', cliff: '#2A2541', deco: '#5E9B5A',
    props: ['pillar', 'pillar', 'brokenpillar', 'barrel'], hazard: 'spikes', grade: null, fog: '#07050E', darkRGB: '4,3,12' },
  swamp: { name: 'Murk Swamp', out: true, dark: 0.45, bg: '#0D1C17', gap: 'water', ambient: 'fireflies', accent: '#9BE07A', light: '#C8FF8A',
    floor: ['#4F703C', '#54763F', '#4B6B39'], grout: '#3C5630', hi: '#7FA35E', top: '#3F5A30', face: '#2F2A1E', faceD: '#221E15', cliff: '#3A3022', deco: '#8CC46A', mud: ['#5C4B33', '#66543A'],
    props: ['mangrove', 'mangrove', 'reeds', 'stump', 'shroom'], hazard: 'gas', grade: 'rgba(60,120,80,.1)', fog: '#0B1813', darkRGB: '4,16,11' },
  caves: { name: 'Crystal Caves', out: false, dark: 0.82, bg: '#070915', gap: 'abyss', ambient: 'motes', accent: '#7FD3F2', light: '#7FD3F2',
    floor: ['#3A3F66', '#424873', '#363B5E'], grout: '#2A2E4D', hi: '#5D6699', top: '#5A6299', face: '#2C3160', faceD: '#1E2245', cliff: '#1E2245', deco: '#7FD3F2',
    props: ['crystal', 'crystal', 'stalag', 'rock'], hazard: 'stalactite', grade: null, fog: '#05060F', darkRGB: '3,4,14' },
  high: { name: 'Windy Highlands', out: true, dark: 0, bg: '#9ED8F5', gap: 'sky', ambient: 'leaves', accent: '#FFE37A', light: '#FFE9A8',
    floor: ['#6EAB4D', '#74B153', '#69A549'], grout: '#5A9440', hi: '#9BD178', top: '#7A5C3E', face: '#8A6B4A', faceD: '#5E4630', cliff: '#8A6B4A', deco: '#FFFFFF', path: ['#C2A270', '#B8976A'],
    props: ['pine', 'pine', 'boulder', 'bush'], hazard: 'rocks', grade: 'rgba(255,230,160,.06)', fog: '#E8F3FB', darkRGB: '0,0,0' },
  frost: { name: 'Frost Vault', out: false, dark: 0.55, bg: '#0A1424', gap: 'iceabyss', ambient: 'snow', accent: '#CFEFFF', light: '#BFEFFF',
    floor: ['#8DB0D3', '#97BBDD', '#86A8CB'], grout: '#6E8FB5', hi: '#C8E2F7', top: '#DCEFFF', face: '#7C9CC4', faceD: '#5D7CA6', cliff: '#5D7CA6', deco: '#FFFFFF', ice: ['#BFE6FF', '#CFEEFF'],
    props: ['iceblock', 'iceblock', 'icespike', 'snowman'], hazard: 'icicle', grade: 'rgba(150,200,255,.08)', fog: '#081222', darkRGB: '4,10,24' },
  hell: { name: 'Ember Hell', out: true, dark: 0.3, bg: '#1A0705', gap: 'lava', ambient: 'embers', accent: '#FF9F43', light: '#FF7A3D',
    floor: ['#3A3440', '#423B48', '#36303C'], grout: '#221D27', hi: '#5C5266', top: '#2A2430', face: '#2A2430', faceD: '#18141C', cliff: '#221C26', deco: '#FF6F3C',
    props: ['obsidian', 'obsidian', 'bones', 'brazier'], hazard: 'geyser', grade: 'rgba(255,90,30,.08)', fog: '#140504', darkRGB: '26,5,2' },
  heaven: { name: 'Cloud Heaven', out: true, dark: 0, bg: '#C9DEFF', gap: 'heaven', ambient: 'sparkles', accent: '#FFD447', light: '#FFF3B0',
    floor: ['#F2DDB0', '#F9EBCB', '#EDD6A6'], grout: '#D4B26A', hi: '#FFFFFF', top: '#FFFFFF', face: '#E6EEFF', faceD: '#C9D6F5', cliff: '#FFFFFF', deco: '#F2C94C',
    props: ['marble', 'marble', 'cloudbush', 'statue'], hazard: 'holy', grade: 'rgba(255,240,200,.08)', fog: '#F6F0FF', darkRGB: '0,0,0' },
  keep: { name: 'Shadow Keep', out: false, dark: 0.86, bg: '#07040C', gap: 'void', ambient: 'wisps', accent: '#E07BF0', light: '#E07BF0',
    floor: ['#2D2539', '#342B43', '#29223A'], grout: '#1F1829', hi: '#4A3D5F', top: '#4A3B63', face: '#241B33', faceD: '#160F21', cliff: '#160F21', deco: '#8C2A4F',
    props: ['pillar', 'candles', 'statue', 'brokenpillar'], hazard: 'hands', grade: 'rgba(120,40,140,.08)', fog: '#050309', darkRGB: '5,2,10' },
  /* the eight new lands */
  desert: { name: 'Sunscorch Desert', out: true, dark: 0, bg: '#F2D59A', gap: 'sand', ambient: 'sand', accent: '#FFB347', light: '#FFE9A8',
    floor: ['#E8C98A', '#EFD39A', '#E2C283'], grout: '#C9A86A', hi: '#FFF0C2', top: '#C98F55', face: '#A8703E', faceD: '#7E5230', cliff: '#B5824C', deco: '#7FB069', path: ['#D9B978', '#CFAE6E'],
    props: ['cactus', 'cactus', 'dunerock', 'palm', 'bones'], hazard: 'sandspout', grade: 'rgba(255,200,120,.08)', fog: '#F0D8A8', darkRGB: '0,0,0' },
  icefield: { name: 'Glacier Plains', out: true, dark: 0.12, bg: '#DCEFFF', gap: 'icewater', ambient: 'snow', accent: '#BFEFFF', light: '#E8F8FF',
    floor: ['#E6F3FB', '#EEF7FD', '#DDEEF9'], grout: '#BFD8EE', hi: '#FFFFFF', top: '#C9E3F5', face: '#8FB6D8', faceD: '#6D95BE', cliff: '#8FB6D8', deco: '#FFFFFF', ice: ['#BFE6FF', '#CFEEFF'],
    props: ['iceblock', 'icespike', 'snowman', 'frozentree', 'igloo'], hazard: 'icespikes', grade: 'rgba(180,220,255,.08)', fog: '#DCEFFF', darkRGB: '10,30,60' },
  volcano: { name: 'Magma Peaks', out: true, dark: 0.35, bg: '#1A0705', gap: 'lava', ambient: 'embers', accent: '#FF7A3D', light: '#FF9F43',
    floor: ['#4A3A3A', '#524040', '#443535'], grout: '#2E2222', hi: '#6E5555', top: '#3A2A2A', face: '#2E2020', faceD: '#1A1212', cliff: '#2A1C1C', deco: '#FF6F3C',
    props: ['volcrock', 'volcrock', 'obsidian', 'ashtree', 'brazier'], hazard: 'geyser', grade: 'rgba(255,90,30,.1)', fog: '#1A0705', darkRGB: '26,5,2' },
  mountain: { name: 'Skyreach Peaks', out: true, dark: 0, bg: '#B8D8F0', gap: 'sky', ambient: 'wind', accent: '#CFE2FF', light: '#FFFFFF',
    floor: ['#8E9BA8', '#97A4B1', '#8793A0'], grout: '#6E7A88', hi: '#B8C4D0', top: '#6F7C8C', face: '#596573', faceD: '#434D59', cliff: '#59636F', deco: '#FFFFFF', path: ['#A89A80', '#9E9077'],
    props: ['peakrock', 'boulder', 'pine', 'cairn', 'pine'], hazard: 'rocks', grade: 'rgba(200,220,255,.07)', fog: '#DCE8F4', darkRGB: '0,0,0' },
  techno: { name: 'Neon Lab', out: false, dark: 0.72, bg: '#070A14', gap: 'grid', ambient: 'motes', accent: '#4DF0FF', light: '#4DF0FF',
    floor: ['#232A3E', '#28304A', '#1F2538'], grout: '#151A28', hi: '#3A4466', top: '#2E3A56', face: '#1C2438', faceD: '#121828', cliff: '#121828', deco: '#4DF0FF',
    props: ['server', 'server', 'neonpillar', 'console', 'drum'], hazard: 'laser', grade: 'rgba(60,200,255,.07)', fog: '#05070F', darkRGB: '3,6,16' },
  steampunk: { name: 'Brass Works', out: false, dark: 0.6, bg: '#1A120C', gap: 'pit', ambient: 'steam', accent: '#F2B35B', light: '#FFB066',
    floor: ['#6B4E3A', '#735541', '#624735'], grout: '#4A3528', hi: '#8E6E55', top: '#8A6A4A', face: '#5A4232', faceD: '#3E2C20', cliff: '#3E2C20', deco: '#C9A24A',
    props: ['gear', 'pipe', 'boiler', 'lamp', 'crate'], hazard: 'steamvent', grade: 'rgba(255,170,80,.08)', fog: '#14100A', darkRGB: '20,12,6' },
  forest: { name: 'Elder Forest', out: true, dark: 0.25, bg: '#1E3A1E', gap: 'river', ambient: 'leaves', accent: '#9BE07A', light: '#D8FF8A',
    floor: ['#4E7A3A', '#548240', '#497238'], grout: '#3A5A2C', hi: '#7FB05E', top: '#3E7A3A', face: '#2E5A2C', faceD: '#1E3E1E', cliff: '#5E4630', deco: '#FF9BD2', mud: ['#5C4B33', '#66543A'],
    props: ['oak', 'oak', 'log', 'fern', 'shroom', 'stump'], hazard: 'thorns', grade: 'rgba(60,140,60,.08)', fog: '#122412', darkRGB: '6,20,8' },
  bloom: { name: 'Blossom Meadow', out: true, dark: 0, bg: '#FFD6E8', gap: 'pond', ambient: 'petals', accent: '#FF9BD2', light: '#FFE3F0',
    floor: ['#9BD178', '#A3D881', '#93C971'], grout: '#7FB05E', hi: '#C8F0A8', top: '#E07BA8', face: '#B85A88', faceD: '#8E3F68', cliff: '#8A6B4A', deco: '#FFFFFF', path: ['#F2D9A0', '#E8CC92'],
    props: ['bigflower', 'bigflower', 'tulips', 'lantern', 'bush', 'pinkshroom'], hazard: 'pollen', grade: 'rgba(255,180,220,.08)', fog: '#F6D8E8', darkRGB: '0,0,0' },
  /* ---- the high lands: ten more, only above floor 100. `tile` borrows an older land's stonework; `storm` paints weather over everything ---- */
  sandstorm: { name: 'Howling Sandstorm', high: true, tile: 'desert', out: true, dark: 0.1, bg: '#C9A05A', gap: 'sand', ambient: 'sand', storm: 'sand', accent: '#FFB347', light: '#FFD88A',
    floor: ['#C9A45E', '#D1AC66', '#C19C57'], grout: '#A5844A', hi: '#E8CB8A', top: '#A8703E', face: '#8A5A32', faceD: '#684226', cliff: '#9A6A3E', deco: '#7FB069', path: ['#B8975A', '#AE8E52'],
    props: ['dunerock', 'dunerock', 'bones', 'cactus', 'palm'], hazard: 'sandspout', grade: 'rgba(230,170,80,.16)', fog: '#C9A05A', darkRGB: '60,40,10' },
  blizzard: { name: 'Whiteout Pass', high: true, tile: 'icefield', out: true, dark: 0.2, bg: '#B8CCDD', gap: 'icewater', ambient: 'snow', storm: 'snow', accent: '#CFEFFF', light: '#FFFFFF',
    floor: ['#CFE0EC', '#D8E7F1', '#C6D9E7'], grout: '#A8C0D2', hi: '#FFFFFF', top: '#B8D0E2', face: '#7C9CB8', faceD: '#5D7C98', cliff: '#7C9CB8', deco: '#FFFFFF', ice: ['#BFE6FF', '#CFEEFF'],
    props: ['iceblock', 'icespike', 'icespike', 'frozentree', 'cairn'], hazard: 'icespikes', grade: 'rgba(200,220,255,.14)', fog: '#B8CCDD', darkRGB: '30,50,80' },
  jungle: { name: 'Vine Jungle', high: true, tile: 'forest', out: true, dark: 0.35, bg: '#0E2A14', gap: 'river', ambient: 'fireflies', accent: '#7FE07A', light: '#C8FF8A',
    floor: ['#2E6A34', '#34743A', '#2A6230'], grout: '#1E4A24', hi: '#5FA05A', top: '#2A6A3A', face: '#1E4A2C', faceD: '#12301C', cliff: '#4A3A22', deco: '#FF9F43', mud: ['#4A3A22', '#54422A'],
    props: ['palm', 'fern', 'fern', 'oak', 'mangrove', 'shroom', 'log'], hazard: 'thorns', grade: 'rgba(40,120,60,.14)', fog: '#0A1E0E', darkRGB: '4,16,8' },
  crag: { name: 'Rocky Mountainside', high: true, tile: 'mountain', out: true, dark: 0.05, bg: '#8FA6B8', gap: 'sky', ambient: 'wind', accent: '#D8C8A8', light: '#FFF4E0',
    floor: ['#6E6A62', '#77736A', '#66625A'], grout: '#524E46', hi: '#9A958A', top: '#5A5650', face: '#44403A', faceD: '#302C28', cliff: '#4A4640', deco: '#B8B0A0', path: ['#8A8070', '#7E7566'],
    props: ['peakrock', 'peakrock', 'boulder', 'cairn', 'boulder', 'pine'], hazard: 'rocks', grade: 'rgba(120,110,100,.1)', fog: '#B8C4CC', darkRGB: '0,0,0' },
  ruins: { name: 'Sunken Ruins', high: true, tile: 'heaven', out: true, dark: 0.3, bg: '#0E2E3A', gap: 'water', ambient: 'motes', accent: '#7FD3F2', light: '#9FE8FF',
    floor: ['#6A8A84', '#72928C', '#62827C'], grout: '#4A6A66', hi: '#9ABAB4', top: '#8AA8A0', face: '#5A7A74', faceD: '#3E5A56', cliff: '#4A6A66', deco: '#7FD3F2',
    props: ['marble', 'brokenpillar', 'brokenpillar', 'statue', 'reeds'], hazard: 'holy', grade: 'rgba(60,140,160,.14)', fog: '#0A2430', darkRGB: '4,20,28' },
  boneyard: { name: 'Ashen Boneyard', high: true, tile: 'keep', out: false, dark: 0.85, bg: '#0A0808', gap: 'void', ambient: 'wisps', accent: '#C8BFA8', light: '#A8E0C0',
    floor: ['#3A3230', '#423A36', '#352E2B'], grout: '#28211F', hi: '#5A504A', top: '#4A4038', face: '#2E2622', faceD: '#1E1816', cliff: '#1E1816', deco: '#E8E0CC',
    props: ['bones', 'bones', 'candles', 'statue', 'brokenpillar'], hazard: 'hands', grade: 'rgba(120,140,110,.08)', fog: '#060404', darkRGB: '6,4,4' },
  glassgarden: { name: 'Glass Garden', high: true, tile: 'bloom', out: true, dark: 0.1, bg: '#D8E8FF', gap: 'pond', ambient: 'sparkles', accent: '#B983F5', light: '#FFFFFF',
    floor: ['#B8D8E8', '#C2E0EE', '#B0D0E2'], grout: '#8AB0C8', hi: '#E8F6FF', top: '#C8A0E8', face: '#9A78C0', faceD: '#705098', cliff: '#8AB0C8', deco: '#FF9BD2', path: ['#E8E0F8', '#DDD4F0'],
    props: ['crystal', 'crystal', 'bigflower', 'lantern', 'tulips'], hazard: 'pollen', grade: 'rgba(180,160,255,.1)', fog: '#E8F0FF', darkRGB: '0,0,0' },
  rift: { name: 'Astral Rift', high: true, tile: 'techno', out: true, dark: 0.75, bg: '#06040F', gap: 'void', ambient: 'sparkles', accent: '#FF4FD8', light: '#8FE8FF',
    floor: ['#2A2248', '#302850', '#261E42'], grout: '#1A1430', hi: '#4A3E78', top: '#3A3060', face: '#221C3A', faceD: '#141026', cliff: '#141026', deco: '#8FE8FF',
    props: ['crystal', 'neonpillar', 'statue', 'crystal', 'stalag'], hazard: 'laser', grade: 'rgba(120,60,200,.12)', fog: '#06040F', darkRGB: '4,2,12' },
  clockwork: { name: 'Clockwork Spire', high: true, tile: 'steampunk', out: false, dark: 0.55, bg: '#120E0C', gap: 'grid', ambient: 'steam', accent: '#F2B35B', light: '#FFD27A',
    floor: ['#5A4A3A', '#634F3E', '#524436'], grout: '#3E3228', hi: '#7E6A55', top: '#7A6040', face: '#4A3A2C', faceD: '#30261C', cliff: '#30261C', deco: '#C9A24A',
    props: ['gear', 'gear', 'pipe', 'boiler', 'console', 'lamp'], hazard: 'steamvent', grade: 'rgba(255,190,100,.1)', fog: '#0E0A08', darkRGB: '14,10,6' },
  autumn: { name: 'Ember Grove', high: true, tile: 'forest', out: true, dark: 0.15, bg: '#4A2A1A', gap: 'river', ambient: 'leaves', accent: '#FF9F43', light: '#FFE3A0',
    floor: ['#8A5A32', '#946238', '#82542E'], grout: '#6A4424', hi: '#B8804A', top: '#7A4A2A', face: '#5A3620', faceD: '#3E2414', cliff: '#5A3620', deco: '#FF6F3C', mud: ['#5C4B33', '#66543A'],
    props: ['oak', 'oak', 'lantern', 'stump', 'log', 'shroom'], hazard: 'thorns', grade: 'rgba(255,140,60,.12)', fog: '#2E1A10', darkRGB: '20,10,4' },
};
const BIOME_ORDER = ['halls', 'swamp', 'caves', 'high', 'frost', 'hell', 'heaven', 'keep', 'desert', 'icefield', 'volcano', 'mountain', 'techno', 'steampunk', 'forest', 'bloom',
  'sandstorm', 'blizzard', 'jungle', 'crag', 'ruins', 'boneyard', 'glassgarden', 'rift', 'clockwork', 'autumn'];
/* the order the acts come in: the four old lands, then the new ones mixed in */
const ACT_ORDER = ['halls', 'swamp', 'caves', 'desert', 'high', 'forest', 'frost', 'icefield', 'hell', 'volcano', 'heaven', 'bloom', 'keep', 'mountain', 'steampunk', 'techno'];
/* above floor 100 the high lands take over, one act each, round and round to the top */
const HIGH_ACT_ORDER = ['sandstorm', 'ruins', 'crag', 'blizzard', 'rift'];   // floors 101 to 120: the dune sea, then up into the sky
const HIGH_FROM = 101;
/* the look a land borrows for its stonework (the high lands share the older lands' painters, in their own colours) */
const biomeTile = k => (BIOMES[k] && BIOMES[k].tile) || k;
/* hazards share mechanics: point traps (spikes / gas / geyser families) and area hazards that fall from above */
const HAZ_FAMILY = { spikes: 'spikes', icespikes: 'spikes', thorns: 'spikes', gas: 'gas', steamvent: 'gas', pollen: 'gas', geyser: 'geyser', sandspout: 'geyser', rocks: 'area', stalactite: 'area', icicle: 'area', holy: 'area', hands: 'area', laser: 'area' };

/* monsters. bio: lands they like to live in. fly: crosses gaps. ghost: also passes through walls. still: never moves.
   kit: two strong attacks and an ult from the shared move library (DunAI.SK) */
const MON = {
  blob: { name: 'Gloomlet', from: 1, hp: 34, spd: 1.9, r: 0.36, dmg: 9, xp: 4, coin: 0.4, color: '#7A63B8', bio: ['halls', 'keep', 'swamp', 'caves'], tip: 'Hops onto you. Watch for the landing ring.', kit: ['volley', 'leap', 'ring'] },
  bat: { name: 'Gloom bat', from: 1, hp: 20, spd: 3.2, r: 0.3, dmg: 7, xp: 4, coin: 0.35, color: '#5A4E8C', bio: ['caves', 'keep', 'halls', 'techno'], fly: true, tip: 'Swoops in a straight line.', kit: ['dash', 'shriek', 'swarm'] },
  spore: { name: 'Sporecap', from: 2, hp: 30, spd: 1.4, r: 0.36, dmg: 9, xp: 5, coin: 0.45, color: '#C77BD9', bio: ['swamp', 'caves', 'halls', 'forest'], tip: 'Spits spores and leaves a poison cloud when it pops.', kit: ['lobpoison', 'cloud', 'rain'] },
  toad: { name: 'Bog toad', from: 2, hp: 42, spd: 1.7, r: 0.4, dmg: 11, xp: 6, coin: 0.45, color: '#5E9E4A', bio: ['swamp', 'forest', 'bloom'], tip: 'Its tongue pulls you in. Then it belly-flops.', kit: ['tongue', 'leap', 'quake'] },
  roller: { name: 'Spikeroll', from: 3, hp: 36, spd: 1.5, r: 0.36, dmg: 12, xp: 5, coin: 0.45, color: '#B0895E', bio: ['high', 'halls', 'hell', 'caves', 'mountain'], tip: 'Curls up and rolls. It gets dizzy when it hits a wall.', kit: ['dash', 'spikes', 'tripledash'] },
  bomb: { name: 'Puffbomb', from: 3, hp: 24, spd: 2.7, r: 0.34, dmg: 20, xp: 5, coin: 0.45, color: '#E86A5A', bio: ['hell', 'halls', 'high', 'volcano', 'steampunk'], tip: 'Rushes you and explodes. Its blast hurts monsters too.', kit: ['mines', 'lobfire', 'nova'] },
  splitter: { name: 'Jellysplit', from: 5, hp: 56, spd: 1.5, r: 0.46, dmg: 10, xp: 7, coin: 0.5, color: '#4FC9B0', bio: ['swamp', 'caves', 'frost', 'icefield'], tip: 'Splits into two when popped.', kit: ['leap', 'ring', 'split'] },
  jelly: { name: 'Jellybit', from: 99, hp: 18, spd: 2.4, r: 0.26, dmg: 6, xp: 2, coin: 0.15, color: '#6FDCC4', bio: [], tip: '', kit: ['leap', 'volley', 'ring'] },
  harpy: { name: 'Storm harpy', from: 5, hp: 38, spd: 2.8, r: 0.38, dmg: 10, xp: 7, coin: 0.5, color: '#6C8FD6', bio: ['high', 'heaven', 'mountain'], fly: true, tip: 'Throws feathers and blows you back with a gust.', kit: ['fan', 'gust', 'storm'] },
  golem: { name: 'Rock golem', from: 6, hp: 120, spd: 1.2, r: 0.5, dmg: 15, xp: 12, coin: 0.9, color: '#8C7B6B', bio: ['high', 'caves', 'halls', 'mountain', 'volcano'], tip: 'Charges in a line and slams the ground.', kit: ['dash', 'quake', 'rocks'] },
  crab: { name: 'Shellcrab', from: 6, hp: 70, spd: 1.1, r: 0.44, dmg: 12, xp: 8, coin: 0.6, color: '#E0785A', bio: ['swamp', 'frost', 'halls', 'desert', 'icefield'], tip: 'Lobs bubbles. Blocks hits while its claws are up.', kit: ['lobbubble', 'shield', 'ringwave'] },
  frost: { name: 'Frost sprite', from: 6, hp: 40, spd: 1.8, r: 0.34, dmg: 10, xp: 7, coin: 0.5, color: '#8FD8FF', bio: ['frost', 'icefield'], fly: true, tip: 'Sends out icy rings. Slip through the gaps.', kit: ['shards', 'ringwave', 'blizzard'] },
  imp: { name: 'Ember imp', from: 7, hp: 34, spd: 2.6, r: 0.34, dmg: 11, xp: 7, coin: 0.55, color: '#E8553D', bio: ['hell', 'keep', 'volcano'], tip: 'Lobs fireballs that leave flames behind.', kit: ['lobfire', 'blink', 'barrage'] },
  nest: { name: 'Gloom nest', from: 7, hp: 110, spd: 0, r: 0.55, dmg: 0, xp: 14, coin: 1, color: '#4A3B7A', bio: ['halls', 'keep', 'swamp', 'caves', 'forest'], still: true, tip: 'Keeps hatching Gloomlets until you break it.', kit: [] },
  cherub: { name: 'Grumpy cherub', from: 9, hp: 48, spd: 2.2, r: 0.36, dmg: 10, xp: 8, coin: 0.6, color: '#FFD98A', bio: ['heaven', 'bloom'], fly: true, tip: 'Heals other monsters and calls down light. Get it first.', kit: ['pillars', 'heal', 'judgment'] },
  wisp: { name: 'Ghost wisp', from: 9, hp: 44, spd: 2.2, r: 0.36, dmg: 10, xp: 7, coin: 0.55, color: '#9FD8F0', bio: ['keep', 'frost', 'caves', 'icefield'], fly: true, ghost: true, tip: 'Drifts through walls and bursts into a ring of orbs.', kit: ['homing', 'blink', 'ring'] },
  eye: { name: 'Watcher', from: 10, hp: 50, spd: 1.6, r: 0.4, dmg: 16, xp: 9, coin: 0.6, color: '#E35D86', bio: ['keep', 'caves', 'techno'], fly: true, tip: 'Charges a laser along the red line. Step aside.', kit: ['laser', 'homing', 'sweep'] },
  knight: { name: 'Gloom knight', from: 10, hp: 110, spd: 1.6, r: 0.46, dmg: 15, xp: 12, coin: 0.9, color: '#6B6F8F', bio: ['keep', 'halls', 'steampunk'], armor: 0.25, tip: 'Armoured. Spins its blade and lunges.', kit: ['dash', 'spin', 'tripledash'] },
  skull: { name: 'Rattlebones', from: 10, hp: 50, spd: 1.8, r: 0.36, dmg: 11, xp: 8, coin: 0.6, color: '#EDE6D6', bio: ['keep', 'hell', 'frost', 'desert'], tip: 'Throws boomerang bones and gets back up. Smash the pile!', kit: ['boomerang', 'fan', 'rain'] },
  totem: { name: 'Hex totem', from: 11, hp: 120, spd: 0, r: 0.5, dmg: 13, xp: 14, coin: 1, color: '#8A5A3C', bio: ['swamp', 'keep', 'heaven', 'hell', 'desert'], still: true, tip: 'Pulses shockwaves and speeds up nearby monsters.', kit: ['ringwave', 'pillars', 'nova'] },
  /* new lands, new monsters */
  scorpion: { name: 'Dune scorpion', from: 2, hp: 44, spd: 2.0, r: 0.4, dmg: 12, xp: 6, coin: 0.5, color: '#C9883E', bio: ['desert', 'volcano'], tip: 'Lunges with its claws and flicks venom from its tail.', kit: ['dash', 'lobpoison', 'tripledash'] },
  cactus: { name: 'Prickly pete', from: 2, hp: 70, spd: 0, r: 0.42, dmg: 10, xp: 8, coin: 0.6, color: '#5FA552', bio: ['desert', 'bloom'], still: true, tip: 'Stays put and shoots needles in every direction.', kit: ['ring', 'fan', 'spikes'] },
  penguin: { name: 'Slide penguin', from: 3, hp: 38, spd: 1.6, r: 0.36, dmg: 9, xp: 5, coin: 0.45, color: '#3A4A66', bio: ['icefield', 'frost'], tip: 'Belly-slides at you and spits snowballs.', kit: ['dash', 'shards', 'ringwave'] },
  magmite: { name: 'Magmite', from: 4, hp: 46, spd: 1.7, r: 0.38, dmg: 12, xp: 6, coin: 0.5, color: '#E85A2A', bio: ['volcano', 'hell'], tip: 'A living lump of lava. Leaves fire where it hops.', kit: ['leap', 'lobfire', 'nova'] },
  goat: { name: 'Crag goat', from: 4, hp: 60, spd: 2.3, r: 0.42, dmg: 13, xp: 7, coin: 0.5, color: '#B9B2A6', bio: ['mountain', 'high', 'desert'], tip: 'Rams you in a line, then stamps the ground.', kit: ['dash', 'quake', 'tripledash'] },
  drone: { name: 'Zap drone', from: 5, hp: 36, spd: 2.6, r: 0.32, dmg: 11, xp: 7, coin: 0.55, color: '#4DF0FF', bio: ['techno', 'steampunk'], fly: true, tip: 'Hovers and fires a thin laser. Step off the line.', kit: ['laser', 'homing', 'sweep'] },
  bot: { name: 'Clank bot', from: 6, hp: 95, spd: 1.3, r: 0.46, dmg: 14, xp: 10, coin: 0.8, color: '#8A94B0', bio: ['techno', 'steampunk'], armor: 0.2, tip: 'Armoured. Launches rockets and spins its arms.', kit: ['barrage', 'spin', 'storm'] },
  gearbug: { name: 'Gear bug', from: 4, hp: 40, spd: 2.4, r: 0.34, dmg: 10, xp: 6, coin: 0.5, color: '#C9A24A', bio: ['steampunk', 'techno'], tip: 'Skitters fast and throws spinning gears.', kit: ['boomerang', 'dash', 'ring'] },
  spiderling: { name: 'Web spider', from: 5, hp: 42, spd: 2.5, r: 0.36, dmg: 11, xp: 6, coin: 0.5, color: '#4A3A5A', bio: ['forest', 'caves', 'keep'], tip: 'Spits sticky webs that slow you, then leaps.', kit: ['web', 'leap', 'rain'] },
  wolf: { name: 'Moon wolf', from: 6, hp: 64, spd: 2.9, r: 0.42, dmg: 13, xp: 8, coin: 0.55, color: '#6E7A8C', bio: ['forest', 'mountain', 'icefield'], tip: 'Hunts in packs and pounces from the side.', kit: ['dash', 'howl', 'tripledash'] },
  bee: { name: 'Bumble bee', from: 3, hp: 30, spd: 2.8, r: 0.32, dmg: 9, xp: 5, coin: 0.45, color: '#FFD447', bio: ['bloom', 'forest', 'high'], fly: true, tip: 'Buzzes around you and stings in a dive.', kit: ['dash', 'fan', 'swarm'] },
  tulip: { name: 'Snap tulip', from: 3, hp: 58, spd: 0, r: 0.4, dmg: 11, xp: 7, coin: 0.55, color: '#FF6F9C', bio: ['bloom', 'forest', 'swamp'], still: true, tip: 'Rooted. Spits seeds and breathes pollen.', kit: ['fan', 'cone', 'cloud'] },
  goblin: { name: 'Gizmo goblin', from: 5, hp: 52, spd: 2.4, r: 0.38, dmg: 12, xp: 7, coin: 0.7, color: '#6FA05A', bio: ['steampunk', 'forest', 'caves'], tip: 'Throws bombs and runs off giggling.', kit: ['lobfire', 'mines', 'barrage'] },
  kitten: { name: 'Laser kitten', from: 7, hp: 48, spd: 2.6, r: 0.36, dmg: 12, xp: 8, coin: 0.7, color: '#F2B36B', bio: ['techno', 'bloom', 'heaven'], tip: 'Pounces, then chases you with a laser pointer.', kit: ['leap', 'laser', 'swarm'] },
  /* the high lands (floor 101 and up): shadows and small things out of old stories */
  shade: { name: 'Shadeling', from: 101, hp: 150, spd: 2.4, r: 0.36, dmg: 26, xp: 16, coin: 0.9, color: '#2A2238', bio: ['boneyard', 'rift', 'ruins', 'jungle'], fly: true, ghost: true, tip: 'A living shadow. Slips through walls, melts away and reappears behind you with a burst of dark orbs.', kit: ['blink', 'homing', 'ring'] },
  umbra: { name: 'Umbra hound', from: 101, hp: 210, spd: 3.0, r: 0.44, dmg: 28, xp: 18, coin: 1.0, color: '#1E1A2E', bio: ['boneyard', 'rift', 'jungle', 'autumn'], tip: 'A hound made of smoke. Hunts in pairs and lunges from the dark; its howl calls the pack.', kit: ['dash', 'howl', 'tripledash'] },
  kitsune: { name: 'Foxfire kitsune', from: 103, hp: 170, spd: 2.7, r: 0.4, dmg: 27, xp: 18, coin: 1.1, color: '#F2B36B', bio: ['autumn', 'jungle', 'glassgarden'], tip: 'Nine tails tipped with foxfire. Lobs blue flames and blinks away when you close in.', kit: ['lobfire', 'blink', 'barrage'] },
  gryphling: { name: 'Gryphling', from: 104, hp: 190, spd: 3.1, r: 0.42, dmg: 27, xp: 18, coin: 1.0, color: '#C9A24A', bio: ['crag', 'blizzard', 'sandstorm'], fly: true, tip: 'A young griffin. Dives in a line, flings feathers and calls a gale down from the peaks.', kit: ['dash', 'fan', 'storm'] },
  gargoyle: { name: 'Gargoyle', from: 105, hp: 320, spd: 1.4, r: 0.48, dmg: 30, xp: 24, coin: 1.5, color: '#6E6A72', bio: ['ruins', 'boneyard', 'clockwork'], armor: 0.35, tip: 'Stone until you come close. Armoured; drops rocks and slams the ground.', kit: ['rocks', 'dash', 'quake'] },
  salamander: { name: 'Cinder salamander', from: 106, hp: 200, spd: 2.2, r: 0.42, dmg: 29, xp: 19, coin: 1.1, color: '#E85A2A', bio: ['sandstorm', 'autumn', 'crag'], tip: 'A lizard that lives in embers. Spits fire and leaves burning tracks when it charges.', kit: ['lobfire', 'dash', 'nova'] },
  naga: { name: 'Sand naga', from: 108, hp: 240, spd: 2.0, r: 0.44, dmg: 30, xp: 21, coin: 1.2, color: '#B89A5A', bio: ['sandstorm', 'ruins', 'jungle'], tip: 'Half serpent, half sorceress. Spits venom, lashes with her tail and rains fangs from above.', kit: ['lobpoison', 'tongue', 'rain'] },
  prism: { name: 'Prism sprite', from: 110, hp: 160, spd: 2.6, r: 0.34, dmg: 26, xp: 17, coin: 1.1, color: '#B983F5', bio: ['glassgarden', 'rift', 'blizzard'], fly: true, tip: 'A fairy of cut glass. Scatters shards of light and bends a laser toward you.', kit: ['shards', 'laser', 'ringwave'] },
  wendigo: { name: 'Frost wendigo', from: 112, hp: 300, spd: 2.5, r: 0.48, dmg: 33, xp: 24, coin: 1.4, color: '#B8C8D8', bio: ['blizzard', 'crag', 'boneyard'], tip: 'Antlered, starving, always hungry. Howls, lunges and calls a blizzard.', kit: ['howl', 'dash', 'blizzard'] },
  mimic: { name: 'Mimic chest', from: 115, hp: 280, spd: 1.8, r: 0.44, dmg: 32, xp: 26, coin: 2.2, color: '#8A5A3C', bio: ['clockwork', 'ruins', 'boneyard', 'rift'], tip: 'A treasure chest with teeth. Still until you reach for it; then spikes, mines and a burst of coins that bite.', kit: ['spikes', 'mines', 'nova'] },
  gremlin: { name: 'Loot gremlin', from: 99, hp: 150, spd: 3.6, r: 0.36, dmg: 0, xp: 20, coin: 0, color: '#9BD15E', bio: [], tip: 'Runs away with treasure. Catch it!', kit: [] },
};
const MON_ORDER = ['blob', 'bat', 'spore', 'toad', 'scorpion', 'cactus', 'roller', 'bomb', 'penguin', 'bee', 'tulip', 'magmite', 'goat', 'gearbug', 'splitter', 'harpy', 'drone', 'spiderling', 'goblin', 'golem', 'crab', 'frost', 'bot', 'wolf', 'imp', 'nest', 'kitten', 'cherub', 'wisp', 'eye', 'knight', 'skull', 'totem',
  'shade', 'umbra', 'kitsune', 'gryphling', 'gargoyle', 'salamander', 'naga', 'prism', 'wendigo', 'mimic'];
const HIGH_MON = ['shade', 'umbra', 'kitsune', 'gryphling', 'gargoyle', 'salamander', 'naga', 'prism', 'wendigo', 'mimic'];
const MON_BOOK = MON_ORDER.concat(['gremlin']);

/* elite monsters lead some packs: bigger, tougher, crowned, with a special power */
const AFFIXES = {
  molten: { name: 'Molten', color: '#FF7A3D', desc: 'Leaves fire and explodes when beaten' },
  frozen: { name: 'Frozen', color: '#7FD3F2', desc: 'Blasts out frost novas' },
  swift: { name: 'Swift', color: '#FFE37A', desc: 'Very fast' },
  vampiric: { name: 'Vampiric', color: '#FF4D6D', desc: 'Heals when it hurts you' },
  shielded: { name: 'Shielded', color: '#8FE3F0', desc: 'A bubble shield soaks up hits' },
  arcane: { name: 'Arcane', color: '#B983F5', desc: 'Fires homing orbs' },
};
const AFFIX_KEYS = Object.keys(AFFIXES);

/* bosses. One rules each land (the act's finale); the rest of the roster, and recoloured variants, guard every other floor */
const BOSSES = [
  { id: 'king', name: 'King Gloomlet', hp: 440, r: 1.25, spd: 1.5, color: '#7A63B8', glow: '#B39CFF', biome: 'halls' },
  { id: 'hydra', name: 'Bog Hydra', hp: 760, r: 1.35, spd: 0.9, color: '#4F8A5B', glow: '#9BE07A', biome: 'swamp' },
  { id: 'moth', name: 'Moth Queen', hp: 820, r: 1.05, spd: 2.6, color: '#C77BD9', glow: '#FF9BD2', biome: 'caves' },
  { id: 'titan', name: 'Stone Titan', hp: 1150, r: 1.35, spd: 1.25, color: '#8C7B6B', glow: '#FF9F43', biome: 'high' },
  { id: 'wizard', name: 'Frost Wizard', hp: 980, r: 0.9, spd: 2, color: '#5B6FB8', glow: '#7FD3F2', biome: 'frost' },
  { id: 'dragon', name: 'Inferno Dragon', hp: 1500, r: 1.5, spd: 1.8, color: '#7A2E3B', glow: '#FF7A3D', biome: 'hell', el: 'fire' },
  { id: 'seraph', name: 'Grumpy Seraph', hp: 1450, r: 1.1, spd: 2.2, color: '#FFE7A8', glow: '#FFE37A', biome: 'heaven' },
  { id: 'shade', name: 'Shadow King', hp: 1800, r: 1.15, spd: 2.4, color: '#3B2F63', glow: '#E07BF0', biome: 'keep' },
  { id: 'sandworm', name: 'Sand Wyrm', hp: 1300, r: 1.3, spd: 1.6, color: '#D9B36B', glow: '#FFD88A', biome: 'desert' },
  { id: 'frostdragon', name: 'Frost Dragon', hp: 1500, r: 1.5, spd: 1.8, color: '#5F93C4', glow: '#BFEFFF', biome: 'icefield', ai: 'dragon', art: 'dragon', el: 'frost' },
  { id: 'magmagolem', name: 'Magma Golem', hp: 1700, r: 1.4, spd: 1.2, color: '#4A2A2A', glow: '#FF7A3D', biome: 'volcano', ai: 'titan', art: 'titan', el: 'fire' },
  { id: 'bigfoot', name: 'Bigfoot', hp: 1600, r: 1.35, spd: 1.7, color: '#6B4A32', glow: '#C9A27A', biome: 'mountain' },
  { id: 'fatcat', name: 'Fat Cat', hp: 1550, r: 1.3, spd: 1.4, color: '#F2B36B', glow: '#FFD88A', biome: 'techno' },
  { id: 'goblinking', name: 'Goblin Tinker King', hp: 1400, r: 1.0, spd: 2.4, color: '#6FA05A', glow: '#C8FF8A', biome: 'steampunk' },
  { id: 'spider', name: 'Giant Spider', hp: 1500, r: 1.35, spd: 2.0, color: '#3A2F4A', glow: '#B983F5', biome: 'forest' },
  { id: 'snake', name: 'Blossom Serpent', hp: 1450, r: 1.2, spd: 2.2, color: '#E07BA8', glow: '#FF9BD2', biome: 'bloom' },
  /* the high lands' finales: old shapes in new colours and worse tempers */
  { id: 'stormwyrm', name: 'Storm Wyrm', hp: 1500, r: 1.3, spd: 1.7, color: '#B89A5A', glow: '#FFE37A', biome: 'sandstorm', ai: 'sandworm', art: 'sandworm', el: 'spark' },
  { id: 'rimewizard', name: 'Rime Warlock', hp: 1200, r: 0.9, spd: 2.1, color: '#2E3A5A', glow: '#CFEFFF', biome: 'blizzard', ai: 'wizard', art: 'wizard', el: 'frost' },
  { id: 'junglehydra', name: 'Jungle Hydra', hp: 1900, r: 1.4, spd: 1.0, color: '#2E6A34', glow: '#7FE07A', biome: 'jungle', ai: 'hydra', art: 'hydra', el: 'leaf' },
  { id: 'cragtitan', name: 'Crag Titan', hp: 2100, r: 1.4, spd: 1.25, color: '#5A5650', glow: '#D8C8A8', biome: 'crag', ai: 'titan', art: 'titan' },
  { id: 'drownedking', name: 'Drowned King', hp: 1700, r: 1.3, spd: 1.5, color: '#4A7A74', glow: '#7FD3F2', biome: 'ruins', ai: 'king', art: 'king', el: 'frost' },
  { id: 'bonedragon', name: 'Bone Dragon', hp: 2000, r: 1.5, spd: 1.8, color: '#C8BFA8', glow: '#A8E0C0', biome: 'boneyard', ai: 'dragon', art: 'dragon', el: 'shadow' },
  { id: 'glassmoth', name: 'Glass Moth', hp: 1600, r: 1.05, spd: 2.7, color: '#B983F5', glow: '#FFFFFF', biome: 'glassgarden', ai: 'moth', art: 'moth' },
  { id: 'voidseraph', name: 'Void Seraph', hp: 2000, r: 1.1, spd: 2.3, color: '#3A2A5A', glow: '#FF4FD8', biome: 'rift', ai: 'seraph', art: 'seraph', el: 'shadow' },
  { id: 'clockcat', name: 'Clockwork Cat', hp: 1900, r: 1.3, spd: 1.5, color: '#C9A24A', glow: '#F2B35B', biome: 'clockwork', ai: 'fatcat', art: 'fatcat', el: 'spark' },
  { id: 'emberspider', name: 'Ember Widow', hp: 1900, r: 1.35, spd: 2.0, color: '#5A2A1A', glow: '#FF9F43', biome: 'autumn', ai: 'spider', art: 'spider', el: 'fire' },
  /* roster-only bosses and variants: they guard the floors between the finales */
  { id: 'skeleking', name: 'Skeleton Lord', hp: 1500, r: 1.2, spd: 1.9, color: '#EDE6D6', glow: '#B9F0FF', bio: ['keep', 'hell', 'frost', 'desert', 'halls'], extra: true },
  { id: 'stormdragon', name: 'Storm Dragon', hp: 1500, r: 1.5, spd: 1.9, color: '#5B6FB8', glow: '#FFE37A', bio: ['high', 'mountain', 'heaven'], ai: 'dragon', art: 'dragon', el: 'spark', extra: true },
  { id: 'venomdragon', name: 'Venom Dragon', hp: 1500, r: 1.5, spd: 1.8, color: '#4F8A5B', glow: '#9BE07A', bio: ['swamp', 'forest', 'bloom'], ai: 'dragon', art: 'dragon', el: 'leaf', extra: true },
  { id: 'crystalgolem', name: 'Crystal Golem', hp: 1300, r: 1.35, spd: 1.25, color: '#6A7FC4', glow: '#7FD3F2', bio: ['caves', 'frost', 'icefield'], ai: 'titan', art: 'titan', el: 'frost', extra: true },
  { id: 'irongolem', name: 'Iron Golem', hp: 1500, r: 1.35, spd: 1.2, color: '#6B6F8F', glow: '#4DF0FF', bio: ['steampunk', 'techno', 'halls'], ai: 'titan', art: 'titan', el: 'spark', extra: true },
  { id: 'frostspider', name: 'Frost Widow', hp: 1400, r: 1.35, spd: 2.0, color: '#6D95BE', glow: '#BFEFFF', bio: ['icefield', 'frost', 'caves'], ai: 'spider', art: 'spider', el: 'frost', extra: true },
  { id: 'dunecobra', name: 'Dune Cobra', hp: 1400, r: 1.2, spd: 2.3, color: '#C9A24A', glow: '#FFE37A', bio: ['desert', 'volcano', 'hell'], ai: 'snake', art: 'snake', el: 'fire', extra: true },
  { id: 'yeti', name: 'Yeti', hp: 1600, r: 1.35, spd: 1.7, color: '#E8F0F8', glow: '#BFEFFF', bio: ['icefield', 'frost', 'mountain'], ai: 'bigfoot', art: 'bigfoot', el: 'frost', extra: true },
  { id: 'goblinchief', name: 'Goblin Warchief', hp: 1400, r: 1.0, spd: 2.4, color: '#8A5A3C', glow: '#FF9F43', bio: ['forest', 'caves', 'desert', 'halls'], ai: 'goblinking', art: 'goblinking', el: 'fire', extra: true },
  { id: 'tomcat', name: 'Alley Tomcat', hp: 1400, r: 1.3, spd: 1.5, color: '#6E7A8C', glow: '#CFE2FF', bio: ['keep', 'steampunk', 'bloom', 'heaven'], ai: 'fatcat', art: 'fatcat', el: 'shadow', extra: true },
  /* the titans: bigger, slower, far more dangerous guardians that can turn up from act 3 on */
  { id: 'octopus', name: 'Abyss Octopus', hp: 1700, r: 1.4, spd: 1.3, color: '#8E2F4A', glow: '#FF8FB1', bio: ['swamp', 'caves', 'icefield', 'bloom'], el: 'shadow', extra: true, titan: true },
  { id: 'behemoth', name: 'Behemoth', hp: 2000, r: 1.5, spd: 1.6, color: '#8A62C4', glow: '#FF9F43', bio: ['high', 'mountain', 'volcano', 'desert', 'hell'], el: 'fire', extra: true, titan: true },
  { id: 'kingape', name: 'King Ape', hp: 1900, r: 1.45, spd: 1.7, color: '#2E2A30', glow: '#FFD447', bio: ['forest', 'bloom', 'mountain', 'halls'], el: 'spark', extra: true, titan: true },
  { id: 'squid', name: 'Kraken Squid', hp: 1800, r: 1.4, spd: 1.5, color: '#C94F6E', glow: '#BFEFFF', bio: ['icefield', 'swamp', 'frost', 'caves'], el: 'frost', extra: true, titan: true },
  { id: 'demonlion', name: 'Demon Lion', hp: 1850, r: 1.4, spd: 2.1, color: '#5A1E34', glow: '#FF7A3D', bio: ['hell', 'keep', 'volcano', 'desert'], el: 'fire', extra: true, titan: true },
];
const BOSS_BY_ID = {}; BOSSES.forEach(B => { BOSS_BY_ID[B.id] = B; });
const BOSS_HP_MEAN = 1300;

/* shrines: touch one for a power-up */
const SHRINES = {
  fury: { name: 'Fury', desc: '+50% damage', color: '#FF5C5C', t: 25 },
  haste: { name: 'Haste', desc: 'Faster moving and attacking', color: '#FFE37A', t: 25 },
  fortune: { name: 'Fortune', desc: 'Double coins', color: '#F2C94C', t: 40 },
  arcane: { name: 'Arcane', desc: 'Every hit gives 3× MP, shorter cooldowns', color: '#7FB6FF', t: 25 },
  guardian: { name: 'Guardian', desc: 'A shield that soaks up damage', color: '#8FE3F0', t: 30 },
};
const SHRINE_KEYS = Object.keys(SHRINES);

/* power stones: pick one up and it works for the rest of the floor. Pick the same one again to level it up */
const POWERS = {
  multiply: { name: 'Multiply', desc: 'Every normal attack fires twice', color: '#FFE37A', glyph: 'twin' },
  swords: { name: 'Orbit Blades', desc: 'Swords circle you and cut anything they touch', color: '#CFE2FF', glyph: 'lance' },
  laser: { name: 'Auto Laser', desc: 'Lasers fire out of you at the nearest monster', color: '#FF5C8A', glyph: 'beam' },
  chainsaws: { name: 'Chainsaws', desc: 'Two chainsaws spin around you', color: '#FF9F43', glyph: 'spin' },
  thunder: { name: 'Storm Call', desc: 'Lightning strikes a monster every second', color: '#B983F5', glyph: 'bolt' },
  frost: { name: 'Frost Aura', desc: 'Monsters near you slow to a crawl', color: '#7FD3F2', glyph: 'snow' },
  bounce: { name: 'Ricochet', desc: 'Your shots bounce off walls', color: '#8FE0A6', glyph: 'bubbles' },
  homing: { name: 'Seeker', desc: 'Your shots curve toward monsters', color: '#FF9BD2', glyph: 'orb' },
  giant: { name: 'Giant', desc: 'Grow huge: +50% damage', color: '#FFB066', glyph: 'slam' },
  vampire: { name: 'Vampire', desc: 'Every hit heals you a little', color: '#FF4D6D', glyph: 'claw' },
  firetrail: { name: 'Fire Trail', desc: 'Leave burning ground as you run', color: '#FF6F3C', glyph: 'flame' },
  shieldorbs: { name: 'Guard Orbs', desc: 'Orbs circle you and eat enemy shots', color: '#8FE3F0', glyph: 'shield' },
  magnet: { name: 'Magnet', desc: 'Pulls in loot from far away. Double coins', color: '#F2C94C', glyph: 'stars' },
  mirror: { name: 'Mirror Image', desc: 'A copy of you fights alongside', color: '#E8E0FF', glyph: 'twin' },
  quick: { name: 'Quickfire', desc: 'Attack 40% faster', color: '#FFD447', glyph: 'burst' },
};
const POWER_KEYS = Object.keys(POWERS);

/* floor grades and the chest each one earns */
const GRADES = [
  { g: 'S', min: 85, color: '#FFD447', chest: 'gold', coinMul: 2, gem: 0.35, card: 0.12 },
  { g: 'A', min: 65, color: '#FF9BD2', chest: 'silver', coinMul: 1.5, gem: 0.18, card: 0.05 },
  { g: 'B', min: 45, color: '#7FD3F2', chest: 'bronze', coinMul: 1.25, gem: 0.08, card: 0 },
  { g: 'C', min: 0, color: '#B9B2CC', chest: 'wood', coinMul: 1, gem: 0, card: 0 },
];
const gradeOf = score => GRADES.find(G => score >= G.min) || GRADES[3];

/* how hard a floor is. Sixteen acts of four floors, one land each. Every floor ends with a boss once its monsters are
   beaten: the act's own boss on the 4th floor, another boss from the roster (picked by the floor's seed) on the rest */
const ACT_LEN = 4;
function floorDef(n) {
  const fiend = fiendFor(n), k = n - 1, act = Math.floor(k / ACT_LEN), boss = (n % ACT_LEN === 0 && !fiend) || ((n + 1) % ACT_LEN === 0 && (n + 1) % 10 === 0);
  const highN = n >= HIGH_FROM, hAct = highN ? Math.floor((n - HIGH_FROM) / ACT_LEN) : 0;
  const actBiome = highN ? HIGH_ACT_ORDER[hAct % HIGH_ACT_ORDER.length] : ACT_ORDER[act % ACT_ORDER.length], B = BOSSES.find(b => b.biome === actBiome), biome = fiend ? fiend.biome : actBiome;
  const loop = highN ? Math.floor(hAct / HIGH_ACT_ORDER.length) : Math.floor(act / ACT_ORDER.length);
  // the Tower's monsters and floor bosses are far tougher than their base stats: a floor-wide layer (health x4 at the
  // foot of the Tower rising to x10 at the top; blows x1.35 rising to x2) and, from floor 10, a second layer on top
  // (health x4, blows x2). Super Fiends have rules of their own (fiendFor). From floor 10 a floor holds twice the monsters
  const gh = clamp((n - 1) / (TOWER_TOP - 1), 0, 1), secHp = n >= 10 ? 4 : 1, secDmg = n >= 10 ? 2 : 1, twice = n >= 10 && !fiend ? 2 : 1;
  // the floor's rule, by band (never on a Super Fiend's floor): keys to find, four guardians, a curse on the party, a
  // boon for the monsters with four lesser bosses roaming, or chaos (curse, boon and keys, with a chance of the fortune
  // turning)
  const band = fiend ? null : n >= 101 && n <= 119 ? 'chaos' : n >= 81 && n <= 99 ? 'boon' : n >= 61 && n <= 79 ? 'curse' : n >= 41 && n <= 59 ? 'four' : n >= 21 && n <= 39 ? 'keys' : null;
  return {
    n, k, act, boss, biome, loop, fiend, high: highN, band,
    name: fiend ? fiend.name : boss ? B.name + romanN(loop) : BIOMES[biome].name,
    bossKind: B,
    hpMul: (1 + 0.26 * k + 0.012 * k * k) * 0.9,
    dmgMul: (1 + 0.13 * k) * 1.1,
    monHp: (4 + 6 * gh) * secHp, monDmg: (1.35 + 0.65 * gh) * secDmg,
    rooms: Math.min(9, 4 + Math.floor(n / 3)),
    pack: Math.min(12, 6 + Math.floor(n / 3)) * twice,
    packsPer: n >= 6 ? 3 : 2,
    maxMons: Math.min(120, 34 + 7 * n) * twice,
    types: MON_ORDER.filter(t => MON[t].from <= n && (n >= HIGH_FROM || !HIGH_MON.includes(t))),
    nests: n >= 7 ? Math.min(3, 1 + Math.floor((n - 7) / 6)) : 0,
    elite: n >= 2 ? Math.min(0.6, 0.15 + 0.04 * (n - 2)) : 0,
    affixes: n >= 15 ? 2 : 1,
    gremlin: n >= 2 ? 0.35 : 0,
    shrines: n >= 2 ? (n >= 10 ? 2 : 1) : 0,
    hazards: n >= 2,
    traps: n >= 3 ? Math.min(6, 2 + Math.floor(n / 4)) : 0,
    stones: n >= 2 ? (n >= 8 ? 3 : 2) : 1,
    events: n >= 3 && !fiend,
    dark: fiend ? 0 : BIOMES[biome].dark,   // a Super Fiend's arena brings its own light
  };
}
/* the boss that guards a floor between finales: one from the roster that likes this land, never the act's own boss */
function floorBossKind(F, R) {
  if (F.boss) return F.bossKind;
  // the titans wait until act 3 (floor 9) so the first fights stay fair
  const pool = BOSSES.filter(b => !b.rift && b.id !== F.bossKind.id && (F.loop > 0 || !b.late) && (!b.titan || F.n >= 9 || F.loop > 0));
  let tot = 0; const w = pool.map(b => { const likes = b.biome === F.biome || (b.bio && b.bio.includes(F.biome)); const v = (likes ? 5 : 1) * (b.extra ? 1.6 : 1); tot += v; return v; });
  let r = R() * tot; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}
const romanN = n => n ? ([' II', ' III', ' IV', ' V', ' VI'][n - 1] || ' ' + (n + 1)) : '';
function bossName(F) { return F.bossKind.name + romanN(F.loop); }

/* soft round glows, drawn additively: much faster than canvas shadows */
const glowCache = new Map();
function hexRGB(h) { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function glowSprite(color) {
  let s = glowCache.get(color);
  if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d'), [r, gg, b] = hexRGB(color), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.22, `rgba(${r},${gg},${b},.62)`); gr.addColorStop(0.55, `rgba(${r},${gg},${b},.18)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glowCache.set(color, s);
  return s;
}

/* ---- soft light sprites for big effects: every edge fades to nothing, so beams, shockwaves and flares melt into the scene ---- */
const fxCache = new Map();
function fxSprite(key, w, h, paint) { let s = fxCache.get(key); if (s) return s; s = document.createElement('canvas'); s.width = w; s.height = h; paint(s.getContext('2d'), w, h); fxCache.set(key, s); return s; }
/* ---- soft sprites laid down at the size they are wanted ----
   A small sprite stretched over a big area is filtered pixel by pixel; a copy made once at the wanted size and put down on
   whole pixels is a plain blend, several times cheaper (a 600px glow costs a sixth as much, a 100px one a third). Sizes are
   kept to within about 4% (no eye tells on a soft light) and places to the nearest pixel (it has no edge to jitter). A
   turned, flipped, tiny or huge one is drawn stretched as before. The copies are kept, the least used let go past a cap.
   A copy is made only for a size asked for a few times over: a ring or glow that grows or shrinks frame by frame asks
   for a new size every frame, and a copy for each (seventy pictures a second, made and let go) was memory a phone could
   not keep up with; those are drawn stretched */
const sizedCache = new Map(), sizedSeen = new Map(); let sizedPx = 0, sizedN = 0;
const SIZED_CAP = 6e6;
function sizeQ(v) { const s = v < 48 ? 2 : Math.round(v * 0.04); return Math.max(2, Math.round(v / s) * s); }
function blitSized(c, img, x, y, w, h) {
  // (a sprite under 7 units across stays under 20 pixels on any screen: it goes stretched, without asking the canvas anything)
  if (!(w >= 6.5 && h >= 6.5)) { c.drawImage(img, x, y, w, h); return; }
  const m = c.getTransform ? c.getTransform() : null;
  if (!m || m.b || m.c || !img || !img.width) { c.drawImage(img, x, y, w, h); return; }
  const W = w * m.a, H = h * m.d;
  if (!(W >= 20 && H >= 20) || W * H > 1.4e6) { c.drawImage(img, x, y, w, h); return; }
  const qw = sizeQ(W), qh = sizeQ(H), key = (img._sid || (img._sid = ++sizedN)) + '|' + qw + '|' + qh;
  let cv = sizedCache.get(key);
  if (cv) { sizedCache.delete(key); sizedCache.set(key, cv); }
  else {
    // (asked for on 8 different frames: a size that stays)
    const fr = (performance.now() / 16) | 0, sn = sizedSeen.get(key) || [0, -1];
    if (sn[1] !== fr) { sn[0]++; sn[1] = fr; }
    if (sn[0] < 8) { if (sizedSeen.size > 3000) sizedSeen.clear(); sizedSeen.set(key, sn); c.drawImage(img, x, y, w, h); return; }
    sizedSeen.delete(key);
    cv = document.createElement('canvas'); cv.width = qw; cv.height = qh; cv.getContext('2d').drawImage(img, 0, 0, qw, qh);
    sizedCache.set(key, cv); sizedPx += qw * qh;
    for (const [k2, v] of sizedCache) { if (sizedPx <= SIZED_CAP || v === cv) break; sizedCache.delete(k2); sizedPx -= v.width * v.height; v.width = v.height = 0; }
  }
  // its centre where it was asked for, its corner on a whole pixel of the canvas
  const X0 = Math.round(m.a * (x + w / 2) + m.e - qw / 2), Y0 = Math.round(m.d * (y + h / 2) + m.f - qh / 2);
  c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cv, X0, Y0); c.setTransform(m);
}
/* a beam strip: gaussian across, fading in at the start and out at the tip. Drawn stretched along the beam */
function beamSprite(color) {
  return fxSprite('beam|' + color, 128, 48, (g, w, h) => {
    const [r, gg, b] = hexRGB(color), im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      const v = (y + 0.5 - h / 2) / (h / 2), across = Math.max(0, (Math.exp(-v * v * 4.2) - Math.exp(-4.2)) / (1 - Math.exp(-4.2)));   // (exactly nothing at its sides)
      for (let x = 0; x < w; x++) {
        const u = (x + 0.5) / w, along = Math.min(1, u / 0.07) * Math.min(1, (1 - u) / 0.13), a = across * along * along * (3 - 2 * along);
        const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(255 * Math.min(1, a));
      }
    }
    g.putImageData(im, 0, 0);
  });
}
/* a ray of light: gaussian across and falling to nothing at both sides, with rounded soft ends. The sprite is three
   parts side by side (the start's fade, an even middle, the end's fade), laid down as three pieces so a ray of any length
   keeps ends as soft as it is wide */
function raySprite(color) {
  return fxSprite('ray|' + color, 96, 48, (g, w, h) => {
    const [r, gg, b] = hexRGB(color), im = g.createImageData(w, h), d = im.data, e0 = Math.exp(-4), sm = x => x * x * (3 - 2 * x);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = (y + 0.5 - h / 2) / (h / 2), u = x < 32 ? (32 - x - 0.5) / 32 : x >= 64 ? (x - 64 + 0.5) / 32 : 0;   // u: how far out past the ray's end
      const q = Math.hypot(v, u), a = q >= 1 ? 0 : (Math.exp(-q * q * 4) - e0) / (1 - e0);
      const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(255 * sm(Math.max(0, Math.min(1, a))));
    }
    g.putImageData(im, 0, 0);
  });
}
/* a soft ray from (x0, y0) to (x1, y1), w across in all (its ends reach w/2 past the points), in a '#rrggbb' colour, with
   a white core (core: its share of the width) if asked; alpha multiplies the canvas's own */
function softRay(c, x0, y0, x1, y1, w, color, alpha, core) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (!(w > 0.3)) return;
  c.save(); c.translate(x0, y0); if (L > 1e-6) c.rotate(Math.atan2(dy, dx)); if (alpha != null) c.globalAlpha *= Math.max(0, Math.min(1, alpha));
  const lay = (img, ww) => { const cap = ww / 2; c.drawImage(img, 0, 0, 32, 48, -cap, -ww / 2, cap, ww); if (L > 0.5) c.drawImage(img, 32, 0, 32, 48, 0, -ww / 2, L, ww); c.drawImage(img, 64, 0, 32, 48, L, -ww / 2, cap, ww); };
  lay(raySprite(color && color[0] === '#' ? color.slice(0, 7) : '#FFFFFF'), w);
  if (core) lay(raySprite('#FFFFFF'), w * core);
  c.restore();
}
/* a hue as a '#rrggbb' (for the rainbow rays), to 24 steps round the wheel so their sprites stay few */
function hueHex(hh, sat, lit) { const H = (Math.round(((hh % 360) + 360) % 360 / 15) * 15) % 360, s2 = (sat == null ? 95 : sat) / 100, l2 = (lit == null ? 65 : lit) / 100, k = n => (n + H / 30) % 12, a = s2 * Math.min(l2, 1 - l2), f = n => Math.round(255 * (l2 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))); return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join(''); }
/* a sheet of light standing on a line: soft at both ends, brightest at its foot and fading to nothing at the top. Drawn
   over the sheet's parallelogram (x along the line, y from the top down to the foot) */
function sheetSprite(color) {
  return fxSprite('sheet|' + color, 64, 64, (g, w, h) => {
    const [r, gg, b] = hexRGB(color), im = g.createImageData(w, h), d = im.data, sm = x => x * x * (3 - 2 * x);
    for (let y = 0; y < h; y++) {
      const v = (y + 0.5) / h, up = v < 0.65 ? 0.45 * sm(v / 0.65) : 0.45 + 0.4 * sm((v - 0.65) / 0.35), foot = Math.min(1, (1 - v) / 0.05);
      for (let x = 0; x < w; x++) {
        const u = (x + 0.5) / w, ends = sm(Math.min(1, u / 0.14)) * sm(Math.min(1, (1 - u) / 0.14)), a = up * foot * ends;
        const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(255 * Math.min(1, a));
      }
    }
    g.putImageData(im, 0, 0);
  });
}
/* a column of light: gaussian across, rising out of its foot and fading away toward the top */
function columnSprite(color) {
  return fxSprite('column|' + color, 32, 128, (g, w, h) => {
    const [r, gg, b] = hexRGB(color), im = g.createImageData(w, h), d = im.data, sm = x => x * x * (3 - 2 * x);
    for (let y = 0; y < h; y++) {
      const v = (y + 0.5) / h, along = sm(Math.min(1, v / 0.35)) * Math.min(1, (1 - v) / 0.04);
      for (let x = 0; x < w; x++) {
        const q = (x + 0.5 - w / 2) / (w / 2), a = Math.max(0, (Math.exp(-q * q * 3.2) - Math.exp(-3.2)) / (1 - Math.exp(-3.2))) * along;
        const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(255 * Math.min(1, a));
      }
    }
    g.putImageData(im, 0, 0);
  });
}
/* a soft shadow: full at its centre, falling evenly to nothing at its rim (as a two-stop radial gradient does), laid down
   at its size with the alpha it is wanted at */
function shadeSprite(color) {
  return fxSprite('shade|' + color, 64, 64, (g, w) => { const [r, gg, b] = hexRGB(color), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
}
/* a shockwave: a soft bright band near the rim, nothing in the middle */
function shockSprite(color) {
  return fxSprite('shock|' + color, 128, 128, (g, w) => {
    const [r, gg, b] = hexRGB(color), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${gg},${b},0)`); gr.addColorStop(0.5, `rgba(${r},${gg},${b},0.04)`); gr.addColorStop(0.74, `rgba(${r},${gg},${b},0.32)`);
    gr.addColorStop(0.86, `rgba(${Math.min(255, r + 90)},${Math.min(255, gg + 90)},${Math.min(255, b + 90)},0.9)`); gr.addColorStop(0.93, `rgba(${r},${gg},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* a lens flare: a hot core with long soft streaks, for muzzles, impacts and the big moments */
function flareSprite(color) {
  return fxSprite('flare|' + color, 128, 128, (g, w) => {
    const [r, gg, b] = hexRGB(color);
    g.globalCompositeOperation = 'lighter';
    const streak = (ang, len, th, a) => { g.save(); g.translate(64, 64); g.rotate(ang); const gr = g.createLinearGradient(-len, 0, len, 0); gr.addColorStop(0, `rgba(${r},${gg},${b},0)`); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, len, th, 0, 0, Math.PI * 2); g.fill(); g.restore(); };
    streak(0, 63, 3.2, 0.95); streak(Math.PI / 2, 40, 2.4, 0.7); streak(Math.PI / 4, 26, 1.6, 0.45); streak(-Math.PI / 4, 26, 1.6, 0.45);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, `rgba(${r},${gg},${b},0.8)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* a soft puff of smoke or steam in any 'rgba(r,g,b,' colour, so smoke never shows a hard rim */
function puffSprite(prefix) {
  if (!prefix || prefix[0] === '#') { const [r, gg, b] = hexRGB(prefix || '#FFFFFF'); prefix = `rgba(${r},${gg},${b},`; }
  else if (!/,\s*$/.test(prefix)) prefix = 'rgba(200,190,230,';
  return fxSprite('puff|' + prefix, 64, 64, (g, w) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, prefix + '1)'); gr.addColorStop(0.45, prefix + '0.6)'); gr.addColorStop(1, prefix + '0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
}
let lightSpriteC = null;
function lightSprite() {
  if (lightSpriteC) return lightSpriteC;
  const s = document.createElement('canvas'); s.width = s.height = 128;
  const g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.85)'); gr.addColorStop(0.8, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  lightSpriteC = s;
  return s;
}
