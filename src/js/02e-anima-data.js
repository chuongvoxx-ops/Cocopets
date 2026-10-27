/* ---------- Animas: the twelve of the Astral Covenant ----------
   Long before the kingdoms existed, twelve primordial beings kept the balance of creation. Six descended from the
   heavens and six rose from the primordial void. When war broke out between them, their forms were sealed inside
   the twelve constellations. Only those who earn their recognition can call them back into the mortal world. */
const COVENANT_LORE = [
  'Long before the kingdoms of this world existed, twelve primordial beings were entrusted with keeping the balance of creation.',
  'Six descended from the heavens. Six emerged from the depths of the primordial void.',
  'When war broke out between them, their physical forms were sealed within the twelve constellations.',
  'Only those who earn their recognition can summon them back into the mortal world.',
  'Above them all, at the summit of the Tower of Oblivion, waited a thirteenth: Bahamut, the Infinite, the sign of Ophiuchus, who judges the twelve. Only one who brings him peace will hear him answer.',
];
const ANIMA_ORDER = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces', 'ophiuchus'];
/* realm: heaven descends in a column of light, void rises from a rift. gem: what Ascension costs */
const ANIMAS = {
  aries: { sign: 'Aries', name: 'Samael', title: 'The Infernal', role: 'Berserker', realm: 'void', el: 'fire', gem: 'citrine', floor: 1, opp: 'libra',
    color: '#FF5A3C', glow: '#FFB066', dark: '#5A1424', forms: ['Ember Lamb', 'Cinder Ram', 'Samael the Infernal'],
    skill: 'Charges into monster after monster. Every hit builds Rage, so the charges get faster and burn harder.',
    finisher: 'Infernal Stampede', finDesc: 'A blazing stampede through every monster in reach, leaving the ground on fire.' },
  taurus: { sign: 'Taurus', name: 'Belial', title: 'The Transcendent', role: 'Tank', realm: 'void', el: 'gold', gem: 'emerald', floor: 7, opp: 'scorpio',
    color: '#F2C65A', glow: '#FFE9A8', dark: '#1E1C24', forms: ['Gilded Calf', 'Bronze Bull', 'Belial the Transcendent'],
    skill: 'Stands guard beside your pet: you take 65% less damage, nearby monsters are dragged to the bull, and every stomp stuns them.',
    finisher: 'Aegis of Ages', finDesc: 'A golden dome makes your pet untouchable while a great quake stuns the room.' },
  gemini: { sign: 'Gemini', name: 'Raziel', title: 'The Celestial', role: 'Blaster', realm: 'heaven', el: 'prism', gem: 'sapphire', floor: 13, opp: 'sagittarius',
    color: '#FFD36B', glow: '#9CC8FF', dark: '#1E2B5C', forms: ['Sun & Moon Wyrmlings', 'Twin Star Dragons', 'Raziel the Celestial'],
    skill: 'The twin celestial dragons of sun and moon coil round your pet, taking turns firing piercing beams of sunlight and moonlight.',
    finisher: 'Twin Helix Nova', finDesc: 'The twins spiral into the sky as one double helix, braid sunlight and moonlight into a single beam and crash it down as a vast yin-yang nova across the room.' },
  cancer: { sign: 'Cancer', name: 'Abaddon', title: 'The Corrupt', role: 'Saboteur', realm: 'void', el: 'shadow', gem: 'amethyst', floor: 19, opp: 'capricorn',
    color: '#5DF2FF', glow: '#8FFCFF', dark: '#3A1426', forms: ['Moonshell Crab', 'Tidebreaker Crab', 'Abaddon the Corrupt'],
    skill: 'Curses every monster nearby: cursed monsters hit 40% softer, take 30% more damage and move slower.',
    finisher: 'Abyssal Tide', finDesc: 'A black tide washes over every monster, cursing and crushing them all.' },
  leo: { sign: 'Leo', name: 'Michael', title: 'The Just', role: 'Paladin', realm: 'heaven', el: 'gold', gem: 'citrine', floor: 3, opp: 'aquarius',
    color: '#FFD36B', glow: '#FFF3C2', dark: '#B9861A', forms: ['Sunpuff Cub', 'Dawnshield Paladin', 'Michael the Just'],
    skill: 'Bounds into monsters behind its shield of sunlight while its warm glow heals your pet over time.',
    finisher: 'Judgement of the Sun', finDesc: 'A roar that bursts like the sun: huge damage around it and a big heal for your pet.' },
  virgo: { sign: 'Virgo', name: 'Gabriel', title: 'The Eternal', role: 'Holy', realm: 'heaven', el: 'prism', gem: 'emerald', floor: 9, opp: 'pisces',
    color: '#FFB3D9', glow: '#FFF0FA', dark: '#B0679E', forms: ['Rosebud Cygnet', 'Bloom Swan', 'Gabriel the Eternal'],
    skill: 'Calls down pillars of holy light on monsters, scattering petals that soothe your pet.',
    finisher: 'Eternal Requiem', finDesc: 'Holy light rains on the whole room, heals your pet and wipes away enemy shots.' },
  libra: { sign: 'Libra', name: 'Uriel', title: 'The Seer', role: 'Arbiter', realm: 'heaven', el: 'gold', gem: 'sapphire', floor: 15, opp: 'aries',
    color: '#FFC24D', glow: '#FFE9A8', dark: '#3A2618', forms: ['Seer Owlet', 'Balance Owl', 'Uriel the Seer'],
    skill: 'Tips the scales: your pet hits 50% harder and attacks faster, while every monster hits 30% softer and takes 20% more damage.',
    finisher: 'Scales of Judgement', finDesc: 'Every monster in sight is weighed and loses a large share of its health.' },
  scorpio: { sign: 'Scorpio', name: 'Asmodeus', title: 'The Fester', role: 'Plague', realm: 'void', el: 'shadow', gem: 'amethyst', floor: 21, opp: 'taurus',
    color: '#FF3B4E', glow: '#FF8A8A', dark: '#1E1418', forms: ['Ember Scorpling', 'Ashen Scorpion', 'Asmodeus the Fester'],
    skill: 'A festering plague: every monster on the whole floor loses health non-stop, and its stinger hunts the nearest.',
    finisher: 'Pandemic', finDesc: 'The plague bursts in every monster on the floor at once.' },
  sagittarius: { sign: 'Sagittarius', name: 'Raphael', title: 'The Magnificent', role: 'Archer', realm: 'heaven', el: 'cosmic', gem: 'citrine', floor: 5, opp: 'gemini',
    color: '#BFA8FF', glow: '#E8E0FF', dark: '#5B4FA8', forms: ['Twinkle Foal', 'Comet Courser', 'Raphael the Magnificent'],
    skill: 'Rains a ceaseless storm of starlight arrows down on every monster around.',
    finisher: 'Heaven\'s Volley', finDesc: 'The sky opens and a deluge of arrows strikes the whole room.' },
  capricorn: { sign: 'Capricorn', name: 'Mammon', title: 'The Lost', role: 'Blaster', realm: 'void', el: 'spark', gem: 'emerald', floor: 11, opp: 'cancer',
    color: '#FFE37A', glow: '#FFF7C2', dark: '#1F3A48', forms: ['Coinfin Kid', 'Stormhorn Seagoat', 'Mammon the Lost'],
    skill: 'Blasts lightning everywhere: bolts leap from monster to monster and strike from the sky.',
    finisher: 'Avarice Tempest', finDesc: 'A storm of lightning that showers the floor with gold coins.' },
  aquarius: { sign: 'Aquarius', name: 'Zadkiel', title: 'The Brave', role: 'Tidecaller', realm: 'heaven', el: 'bubble', gem: 'sapphire', floor: 17, opp: 'leo',
    color: '#5FD4FF', glow: '#C9F3FF', dark: '#1F4AA8', forms: ['Droplet Wyrmling', 'Rillfin Drake', 'Zadkiel the Brave'],
    skill: 'Shoots orbs of celestial water that splash, knock monsters back and wash over groups.',
    finisher: 'Celestial Deluge', finDesc: 'A tidal wave rolls out from Zadkiel and sweeps the room.' },
  pisces: { sign: 'Pisces', name: 'Leviathan', title: 'The Breaker of Chains', role: 'Liberator', realm: 'void', el: 'cosmic', gem: 'amethyst', floor: 23, opp: 'virgo',
    color: '#B9A6FF', glow: '#EAF2FF', dark: '#2A1E5C', forms: ['Twin Minnows', 'Silkfin Koi', 'Leviathan the Breaker of Chains'],
    skill: 'Breaks every chain: frees your pet from slows and curses, refills cooldowns, shatters monster shields, and its whirlpool drags monsters in.',
    finisher: 'Tide of Unbinding', finDesc: 'The whirlpool bursts outward, sweeps away every enemy shot and leaves your pet untouchable.' },
  // the thirteenth: no sign opposes it, it cannot be unsealed for crystals, and it answers only once Bahamut is at peace
  ophiuchus: { sign: 'Ophiuchus', name: 'Bahamut', title: 'The Infinite', role: 'Judge', realm: 'heaven', el: 'cosmic', gem: 'sapphire', floor: 120, opp: null, secret: true,
    color: '#FFD36B', glow: '#BFF4FF', dark: '#0A1A30', forms: ['Starling Fry', 'Gyre Seraph', 'Bahamut the Infinite'],
    skill: 'Floats beside your pet in its gyroscope of golden rings: lashes of light strike monster after monster, and its rings ring out in waves that stun.',
    finisher: 'Final Judgement', finDesc: 'Night falls, the rings align into the golden corridor and every monster in sight is judged by a pillar of light from the heavens: the strongest attack in the game.' },
};
ANIMA_ORDER.forEach(id => { ANIMAS[id].id = id; });
/* from Guardian (stage 5) a pet can bind a second Anima. Opposite signs summoned together unleash a Zodiac Resonance,
   any other pair awakens together in Astral Harmony */
const RESONANCE = {
  'aries|libra': { name: 'Judgement Pyre', desc: 'Uriel weighs every monster and Samael sets the guilty ablaze: a pillar of hellfire on each one.' },
  'taurus|scorpio': { name: 'Fortress of Rot', desc: 'Belial\'s golden fortress shields your pet while Asmodeus\'s plague erupts in every monster on the floor.' },
  'gemini|sagittarius': { name: 'Starfall Volley', desc: 'Sun and moon beams cross the room as Raphael looses a thousand star arrows through them.' },
  'cancer|capricorn': { name: 'Abyssal Storm', desc: 'Abaddon\'s black tide curses everything; Mammon\'s lightning strikes every cursed monster.' },
  'leo|aquarius': { name: 'Solar Tide', desc: 'Sunlight and celestial water become one radiant wave that crushes monsters and restores your pet.' },
  'virgo|pisces': { name: 'Eternal Covenant', desc: 'Holy light and unbound tides: your pet is fully healed and freed, and every monster is smitten.' },
};
const resKey = (a, b) => [a, b].sort((x, y) => ANIMA_ORDER.indexOf(x) - ANIMA_ORDER.indexOf(y)).join('|');
const resonanceOf = (a, b) => (a && b && ANIMAS[a].opp === b ? RESONANCE[resKey(a, b)] : null);
const RESONANCE_STAGE = 5;
const HARMONY = { name: 'Astral Harmony', desc: 'Both Animas awaken as one: their Astral Awakenings strike together, joined by a burst of starlight.', generic: true };
const pairResonance = (a, b) => (a && b && a !== b ? resonanceOf(a, b) || HARMONY : null);
/* Ascension: three forms. Gems of the Anima's element, starstones for the last step, and coins */
const ASCEND = [null, null, { gems: 3, star: 0, crystals: 500 }, { gems: 5, star: 2, crystals: 1000 }];
const ANIMA_POWER = [0, 1.6, 2.5, 3.6], ANIMA_DUR = [0, 10, 12, 14], ANIMA_SIZE = [0, 2.1, 2.6, 3.1];
// Bahamut, the thirteenth, stands a third again as large as the zodiac in the Tower
const OPH_BIG = 1.3;
const ANIMA_SIGIL = 450;   // crystals to unseal an Anima before you have earned it
/* the zodiac glyphs, drawn as strokes in a 24 x 24 box */
const ZODIAC_GLYPH = {
  aries: 'M4.5 9.5C4.5 6 6.4 4 8.4 4S12 6.4 12 10v10M19.5 9.5C19.5 6 17.6 4 15.6 4S12 6.4 12 10',
  taurus: 'M7 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0M4 4.5c1.6 3 4.4 5 8 5s6.4-2 8-5',
  gemini: 'M5 4.5c4.2 1.6 9.8 1.6 14 0M5 19.5c4.2-1.6 9.8-1.6 14 0M9 5.6v12.8M15 5.6v12.8',
  cancer: 'M4.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M7 6.5C11 4.5 16 5.5 19.5 9M14.5 15a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M17 17.5C13 19.5 8 18.5 4.5 15',
  leo: 'M4 15a3 3 0 1 0 6 0a3 3 0 1 0-6 0M10 15C10 9 9.5 4 13.5 4s4.5 4 2.5 8-2 7 1.5 8.4c1.8.7 3-.6 3-2',
  virgo: 'M4 6.5c1.5 0 2.5 1 2.5 3v10M6.5 9.5c0-2 1.4-3 3-3s3 1 3 3v10M12.5 9.5c0-2 1.4-3 3-3s3 1 3 3v4.5c0 3-1.6 5-4.2 6.3M19 13.5c-2.2.2-3.8 1.7-3.8 4.2',
  libra: 'M3.5 20h17M3.5 15.5h5.6a3.6 3.6 0 1 1 5.8 0h5.6',
  scorpio: 'M4 6.5c1.5 0 2.5 1 2.5 3v10M6.5 9.5c0-2 1.4-3 3-3s3 1 3 3v10M12.5 9.5c0-2 1.4-3 3-3s3 1 3 3v8.6l2.6 2M21.4 16.3l-.4 3.9-3.9.4',
  sagittarius: 'M4 20 20 4M11.5 4H20v8.5M7.5 11.5l5 5',
  capricorn: 'M3.5 5.5c2 0 3.1 1.6 3.6 4.2l2.4 9.3 2.9-10.8c.5-2 1.6-3 3.1-3 1.7 0 3 1.6 3 4 0 2.7-2.1 4-4 5.4-1.8 1.3-2 3.1-.6 4.3 1.3 1.1 3.2.5 3.4-1.4',
  aquarius: 'M3.5 10.5l3-3 3 3 3-3 3 3 3-3 2 2M3.5 17l3-3 3 3 3-3 3 3 3-3 2 2',
  pisces: 'M5.5 3.5c3 2.5 4 5.5 4 8.5s-1 6-4 8.5M18.5 3.5c-3 2.5-4 5.5-4 8.5s1 6 4 8.5M7.5 12h9',
  ophiuchus: 'M3 12.5c1.8-4.2 4-4.2 5.4 0s3.6 4.2 5.2 0 3.7-4.2 6.4-1.3M3.5 19h17M12 3.2v3.4M10.3 4.9h3.4',
};
/* each sign's stars, roughly as they sit in the sky, and the lines between them */
const CONSTELLATION = {
  aries: { p: [[0.14, 0.62], [0.42, 0.45], [0.62, 0.40], [0.82, 0.48], [0.68, 0.30]], e: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  taurus: { p: [[0.50, 0.55], [0.42, 0.48], [0.35, 0.40], [0.16, 0.20], [0.57, 0.46], [0.63, 0.37], [0.84, 0.22], [0.48, 0.70], [0.40, 0.84]], e: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [0, 7], [7, 8]] },
  gemini: { p: [[0.30, 0.14], [0.32, 0.35], [0.30, 0.56], [0.24, 0.82], [0.62, 0.17], [0.63, 0.38], [0.65, 0.59], [0.72, 0.83]], e: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [0, 4], [2, 6]] },
  cancer: { p: [[0.50, 0.32], [0.48, 0.52], [0.28, 0.72], [0.68, 0.74], [0.53, 0.14]], e: [[4, 0], [0, 1], [1, 2], [1, 3]] },
  leo: { p: [[0.20, 0.30], [0.28, 0.17], [0.41, 0.19], [0.43, 0.32], [0.36, 0.44], [0.38, 0.58], [0.66, 0.55], [0.86, 0.68], [0.63, 0.40]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [6, 8], [8, 3]] },
  virgo: { p: [[0.14, 0.30], [0.30, 0.38], [0.45, 0.35], [0.55, 0.48], [0.70, 0.45], [0.86, 0.30], [0.60, 0.68], [0.76, 0.83], [0.42, 0.71]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7], [6, 8]] },
  libra: { p: [[0.50, 0.18], [0.29, 0.42], [0.71, 0.42], [0.24, 0.72], [0.76, 0.70]], e: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]] },
  scorpio: { p: [[0.14, 0.24], [0.22, 0.36], [0.26, 0.17], [0.35, 0.41], [0.42, 0.51], [0.48, 0.63], [0.55, 0.75], [0.68, 0.81], [0.80, 0.75], [0.85, 0.63], [0.78, 0.56]], e: [[0, 1], [2, 1], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]] },
  sagittarius: { p: [[0.24, 0.46], [0.40, 0.40], [0.42, 0.61], [0.30, 0.69], [0.55, 0.29], [0.62, 0.45], [0.58, 0.63], [0.79, 0.38], [0.83, 0.56]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [5, 6], [6, 2], [5, 7], [7, 8], [8, 6]] },
  capricorn: { p: [[0.14, 0.30], [0.30, 0.46], [0.45, 0.62], [0.62, 0.71], [0.80, 0.56], [0.88, 0.35], [0.70, 0.40], [0.50, 0.38]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]] },
  aquarius: { p: [[0.14, 0.35], [0.30, 0.28], [0.45, 0.35], [0.55, 0.50], [0.50, 0.70], [0.65, 0.82], [0.70, 0.55], [0.86, 0.60], [0.40, 0.18]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7], [1, 8]] },
  pisces: { p: [[0.14, 0.24], [0.20, 0.40], [0.30, 0.55], [0.45, 0.70], [0.58, 0.80], [0.70, 0.65], [0.82, 0.55], [0.88, 0.63], [0.80, 0.71], [0.74, 0.62], [0.40, 0.40], [0.35, 0.27]], e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 6], [3, 10], [10, 11]] },
  // the serpent-bearer: a tall figure of five stars under a bright head, the serpent drawn across it
  ophiuchus: { p: [[0.50, 0.10], [0.35, 0.30], [0.66, 0.27], [0.30, 0.58], [0.71, 0.55], [0.40, 0.84], [0.62, 0.86], [0.10, 0.46], [0.20, 0.50], [0.82, 0.44], [0.92, 0.36]], e: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [7, 8], [8, 3], [4, 9], [9, 10]] },
};
/* a battle theme each: tempo, scale steps (semitones from the root, null = rest), lead and bass waves */
const ANIMA_THEME = {
  aries: { bpm: 156, root: 220, wave: 'sawtooth', bwave: 'square', lead: [0, 1, 3, null, 7, 6, 3, 1, 0, null, 0, 3, 8, 7, 3, 1], bass: [0, 0, 0, 0, 1, 1, 0, 0, -2, -2, 0, 0, 1, 1, -5, -5] },
  taurus: { bpm: 92, root: 147, wave: 'triangle', bwave: 'square', lead: [0, null, 3, null, 5, null, 7, 5, 3, null, 0, null, -2, null, 0, null], bass: [0, 0, 0, 0, -5, -5, -5, -5, -2, -2, -2, -2, -5, -5, 0, 0] },
  gemini: { bpm: 128, root: 330, wave: 'square', bwave: 'triangle', lead: [0, 4, 7, 12, 7, 4, 9, 7, 5, 9, 12, 16, 12, 9, 7, 4], bass: [0, 0, 7, 7, 5, 5, 4, 4, 2, 2, 7, 7, 0, 0, 7, 7] },
  cancer: { bpm: 100, root: 196, wave: 'sine', bwave: 'triangle', lead: [0, 3, 6, null, 9, 6, 3, null, 0, 3, 6, 9, 12, null, 9, 6], bass: [0, 0, 0, 0, 6, 6, 6, 6, 3, 3, 3, 3, 0, 0, -3, -3] },
  leo: { bpm: 120, root: 262, wave: 'triangle', bwave: 'square', lead: [0, null, 7, 4, 7, null, 12, 11, 9, 7, 9, 12, 16, null, 12, null], bass: [0, 0, 0, 0, 5, 5, 5, 5, 7, 7, 7, 7, 0, 0, 0, 0] },
  virgo: { bpm: 84, root: 392, wave: 'sine', bwave: 'sine', lead: [0, 4, 6, 11, 12, 11, 7, 4, 6, 9, 11, 14, 12, 7, 4, 2], bass: [0, 0, 0, 0, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 0, 0] },
  libra: { bpm: 108, root: 294, wave: 'triangle', bwave: 'triangle', lead: [0, 2, 3, 5, 7, 9, 10, 9, 7, 5, 3, 2, 0, null, 7, null], bass: [0, 0, 7, 7, 3, 3, 10, 10, 5, 5, 0, 0, 7, 7, 0, 0] },
  scorpio: { bpm: 112, root: 175, wave: 'sawtooth', bwave: 'sawtooth', lead: [0, 1, 4, 5, 7, 8, 11, 12, 11, 8, 7, 5, 4, 1, 0, null], bass: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1] },
  sagittarius: { bpm: 144, root: 294, wave: 'square', bwave: 'triangle', lead: [0, 4, 7, 10, 12, 10, 7, 4, 5, 9, 12, 14, 12, 9, 7, 5], bass: [0, null, 0, 7, 0, null, 0, 7, 5, null, 5, 10, 5, null, 5, 7] },
  capricorn: { bpm: 132, root: 247, wave: 'square', bwave: 'sawtooth', lead: [0, 1, 0, 6, 7, null, 6, 1, 0, 1, 3, 6, 7, 10, 7, 6], bass: [0, 0, 0, 0, 6, 6, 6, 6, 1, 1, 1, 1, -6, -6, -6, -6] },
  aquarius: { bpm: 96, root: 349, wave: 'sine', bwave: 'triangle', lead: [0, 2, 4, 7, 9, 12, 9, 7, 4, 7, 9, 12, 14, 12, 9, 7], bass: [0, 0, 0, 0, 7, 7, 7, 7, 9, 9, 9, 9, 4, 4, 4, 4] },
  pisces: { bpm: 76, root: 330, wave: 'sine', bwave: 'sine', lead: [0, 2, 4, 6, 8, 10, 12, null, 10, 8, 6, 4, 2, null, 0, null], bass: [0, 0, 0, 0, 4, 4, 4, 4, 8, 8, 8, 8, 4, 4, 4, 4] },
  ophiuchus: { bpm: 88, root: 196, wave: 'triangle', bwave: 'sine', lead: [0, 7, 12, null, 14, 12, 7, null, 5, 9, 12, 17, 19, null, 14, 12], bass: [0, 0, 0, 0, -5, -5, -5, -5, -3, -3, -3, -3, -7, -7, -5, -5] },
};
