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
  // v435 SM: Samael remade as The First Cataclysm, Zodiac Anima No. 01: a colossal ram-dragon of black gold-edged scales and molten fire
  // round a dying star, Fire / Dark, a Berserker (the same 'aries' key, so saves, gems and ascension carry over). Its forms are The First
  // Cataclysm, The Fiery Herald and The Starforged Ram; its four powers, Ruin Pressure and its finisher are 20g4-samael-moves.js, its model 02f5
  aries: { sign: 'Aries', name: 'Samael', title: 'The First Cataclysm', role: 'Berserker · Heavy Assault', realm: 'void', el: 'fire', elems: 'Fire / Dark', no: 1, gem: 'citrine', floor: 1, opp: 'libra',
    color: '#FF5A3C', glow: '#FFB066', dark: '#5A1424', forms: ['The First Cataclysm', 'The Fiery Herald', 'The Starforged Ram'],   // (v435 SM: the forms named after the concept sheet)
    tag: 'Zodiac Anima No. 01 · Fire / Dark · the first to awaken: a ram-dragon of black scales and molten fire forged round a dying star, whose first charge shattered the heavens.',
    skill: 'An unstoppable berserker that picks its attack for the fight: Hellbreak Charge gallops through far monsters, Horns of Perdition hurls spinning crescents of plasma, Furnace Overdrive ignites its heart for faster, burning attacks, and First Impact leaps and crashes down on a crowd. Every blow builds Ruin Pressure until it erupts into the Cataclysm State.',
    finisher: 'Wrath of the Fallen', finDesc: 'Samael rises into the sky, becomes a living meteor and falls on the battlefield: a cataclysmic explosion that strikes the nearest monsters hardest, then rings of fire that burn everything and leave it taking more damage.' },
  // v426 BL: Belial remade as The World Pillar, Zodiac Anima No. 02: a colossal biomechanical bull and living citadel of obsidian, bronze,
  // gold and ivory stone, Earth / Metal, a Tank and Juggernaut (the same 'taurus' key, so saves, gems and ascension carry over). Its forms are
  // the fortress-bull, the Ascended and the Celestial; its four powers and its finisher are 20g3-belial-moves.js, its model 02f4
  taurus: { sign: 'Taurus', name: 'Belial', title: 'The World Pillar', role: 'Tank · Juggernaut', realm: 'void', el: 'earth', elems: 'Earth / Metal', no: 2, gem: 'emerald', floor: 7, opp: 'scorpio',
    color: '#F2C65A', glow: '#FFE9A8', dark: '#1E1C24', forms: ['Belial', 'Ascended Belial', 'Celestial Belial'],
    tag: 'Zodiac Anima No. 02 · Earth / Metal · a colossal biomechanical god and living citadel that anchors the heavens to the earth.',
    skill: 'An immovable juggernaut that picks its power for the fight: Thronebreaker Rush charges through far monsters, Crown of Burdens slows and gathers a crowd under falling rings, Citadel Carapace shields your pet and stores the blows for a crushing retaliation, and Graviton Stampede pounds everything clustered round it.',
    finisher: 'Dominion of the World Pillar', finDesc: 'Belial seizes the world\'s gravity: colossal pillars rise round the room, everything is crushed inward and two great pulses of golden force strike every monster, leaving them slowed and taking more damage.' },
  // v464 RZ-M: Raziel remade as The Twin Revelation, Zodiac Anima No. 03: a colossal two-headed biomechanical dragon of Fire (Lux, its left
  // head) and Ice (Umbra, its right), Fire / Ice, a Hybrid DPS and Battlefield Controller (the same 'gemini' key, so saves, gems, ascension
  // and the Gemini gate carry over). Its forms are The Twin Revelation, The Mirrored Sovereign and The Divine Equation; its model is 02f7
  gemini: { sign: 'Gemini', name: 'Raziel', title: 'The Twin Revelation', role: 'Hybrid DPS · Battlefield Controller', realm: 'heaven', el: 'fire', el2: 'frost', elems: 'Fire / Ice', no: 3, gem: 'sapphire', floor: 13, opp: 'sagittarius',
    color: '#FFB347', glow: '#8FDCFF', dark: '#141C34', forms: ['The Twin Revelation', 'The Mirrored Sovereign', 'The Divine Equation'],
    tag: 'Zodiac Anima No. 03 · Fire / Ice · an ancient celestial machine with two minds: Lux of eternal flame and Umbra of absolute cold, two opposing heavens sharing one divine body.',
    // v464 RZ-A: its powers, Dual Alignment, Thermal Shock and the finisher (20g6-raziel-moves.js, 20g6b-raziel-ultimate.js)
    skill: 'Two minds, one body: Lux breathes fire, Umbra breathes ice, and Raziel picks its power for the fight. Twin Fang Protocol crosses a stream of fire and a blizzard over the monsters, Mirror Divide opens a burning and a freezing domain that drift together, Revelation Circuit joins its two reactors to strengthen every attack (yours too), and Binary Cataclysm hurls a plasma sun and an ice planet that collide. Fire and Ice on the same monster set off a Thermal Shock; it shifts between Concord (both heads on one target) and Dissonance (each head on its own).',
    finisher: 'The Book of Two Heavens', finDesc: 'Raziel\'s crowns open into a heaven of fire and a heaven of frost, spectral dragons pour fire and ice across the field, and its two cores collide into a white singularity: a pillar of light and a great Thermal Shock eruption.' },
  // v418 AB: Abaddon remade as The Eternal Moonlight, Zodiac Anima No. 04: an ancient biomechanical lunar god of porcelain, platinum
  // and obsidian, Water / Shadow, a Guardian (the same 'cancer' key, so saves, gems and ascension carry over). Its forms are
  // the sealed lunar shell, the half-unfolded warden and the full god; its four powers and its finisher are 20g2-abaddon-moves.js
  cancer: { sign: 'Cancer', name: 'Abaddon', title: 'The Eternal Moonlight', role: 'Guardian · Tank', realm: 'void', el: 'shadow', el2: 'bubble', elems: 'Water / Shadow', no: 4, gem: 'amethyst', floor: 19, opp: 'capricorn',
    color: '#6FA2FF', glow: '#D8E6FF', dark: '#0B1230', forms: ['Sealed Moonshell', 'Crescent Warden', 'Abaddon the Eternal Moonlight'],
    tag: 'Zodiac Anima No. 04 · Water / Shadow · a primordial guardian that would rather seal life away beneath an eternal moon than see it harmed.',
    skill: 'Guards your pet like a fortress: Lunar Carapace shields it and stores every blow it absorbs, Crescent Reavers sweep monsters together, Gravitational Tide lifts and drags them in, and Eclipse Requiem seals the stored power into a great shockwave.',
    finisher: 'The Ninth Tide', finDesc: 'Abaddon rises over the room, raises the sea into the sky round an artificial moon, crushes it to a single point and lets it burst as one vast tide: huge damage, Lunar Weakness on every monster and a lunar shield on your pet.' },
  leo: { sign: 'Leo', name: 'Michael', title: 'The Just', role: 'Paladin', realm: 'heaven', el: 'gold', gem: 'citrine', floor: 3, opp: 'aquarius',
    color: '#FFD36B', glow: '#FFF3C2', dark: '#B9861A', forms: ['Sunpuff Cub', 'Dawnshield Paladin', 'Michael the Just'],
    skill: 'Bounds into monsters behind its shield of sunlight while its warm glow heals your pet over time.',
    finisher: 'Judgement of the Sun', finDesc: 'A roar that bursts like the sun: huge damage around it and a big heal for your pet.' },
  // v475 GM: Gabriel remade as The Sacred Oracle, Zodiac Anima No. 06: a colossal white-and-gold mechanical phoenix holding the Bound
  // Oracle in the Heart of Eden, its chest, under a halo of Twelve Petals of Mercy; Light (the game's pink 'prism'), a Healer (the same
  // 'virgo' key, so saves, gems, ascension and the Virgo gate carry over). The model is 02f8-gabriel-model.js
  virgo: { sign: 'Virgo', name: 'Gabriel', title: 'The Sacred Oracle', role: 'Healer · Support · Purifier', realm: 'heaven', el: 'prism', elems: 'Light', no: 6, gem: 'emerald', floor: 9, opp: 'pisces',
    color: '#FF9BD2', glow: '#FFF0FA', dark: '#B0478E', forms: ['The Bound Seraph', 'The Heart of Mercy', 'Eden Incarnate'],
    tag: 'Zodiac Anima No. 06 · Light · a celestial phoenix-machine built to hold and protect the Bound Oracle, whose compassion it turns into healing.',
    skill: 'Heals and shields your pet and judges monsters with its twelve petals: Bloom of Mercy sends healing crystal hearts (and cleanses), Harvest Halo throws petal-blades that lay Judgement Marks, Sanctuary Weave raises a heart cathedral that softens blows and shields, and Thresher of Stars drops a celestial spear that consumes the marks. Grace Hearts on your pet deepen its healing.',   // v475 GA
    finisher: 'Eden Reborn', finDesc: 'The Bound Oracle rises free and paradise blooms over the room: your pet is healed (up to 60%), shielded and cleansed, monsters take great Light damage and their Judgement Marks burst.' },   // v475 GA
  libra: { sign: 'Libra', name: 'Uriel', title: 'The Seer', role: 'Arbiter', realm: 'heaven', el: 'gold', gem: 'sapphire', floor: 15, opp: 'aries',
    color: '#FFC24D', glow: '#FFE9A8', dark: '#3A2618', forms: ['Seer Owlet', 'Balance Owl', 'Uriel the Seer'],
    skill: 'Tips the scales: your pet hits 50% harder and attacks faster, while every monster hits 30% softer and takes 20% more damage.',
    finisher: 'Scales of Judgement', finDesc: 'Every monster in sight is weighed and loses a large share of its health.' },
  // v436 AS: Asmodeus remade as a biomechanical god on six blade legs crowned by seven stingers, Zodiac Anima No. 08, Dark / Poison, an
  // Assassin, Debuffer and Area Control (the same 'scorpio' key and his title The Fester, at the user's word, so saves, gems and ascension
  // carry over). Its forms are The Veiled Predator, The Crimson Sovereign and The Seventh Sin; Venom Debt, its four powers and its finisher
  // are 20g5-asmodeus-moves.js, its model 02f6
  scorpio: { sign: 'Scorpio', name: 'Asmodeus', title: 'The Fester', role: 'Assassin · Debuffer · Area Control', realm: 'void', el: 'shadow', elems: 'Dark / Poison', no: 8, gem: 'amethyst', floor: 21, opp: 'taurus',
    color: '#FF2A4A', glow: '#FF8AA8', dark: '#1E0C16', forms: ['The Veiled Predator', 'The Crimson Sovereign', 'The Seventh Sin'],
    tag: 'Zodiac Anima No. 08 · Dark / Poison · an ancient alchemical god of venom and forbidden knowledge that never kills at once: it marks its prey with seven curses and lets each one deepen.',
    skill: 'A patient assassin that picks its attack for the fight: Sevenfold Perdition strikes again and again with its seven stingers, Crimson Labyrinth binds a crowd in a web of ruby wire, Eclipse Molt leaves a crystal shell behind and strikes from behind, and Scarlet Rupture shatters a great crystal into waves of blades. Every venom blow lays Venom Debt, up to seven stacks that poison and deepen every detonation.',
    finisher: 'The Seventh Sin', finDesc: 'Asmodeus raises its stingers into a cathedral of crimson light, blooms its heart into a flower of ruby and strikes seven times, then everything collapses into one detonation that consumes every stack of Venom Debt on the field.' },
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
  'gemini|sagittarius': { name: 'Starfall Volley', desc: 'Streams of fire and ice cross the room as Raphael looses a thousand star arrows through them.' },   // v464 RZ-A: Fire / Ice
  'cancer|capricorn': { name: 'Abyssal Storm', desc: 'Abaddon\'s lunar tide drags every monster down and weakens it; Mammon\'s lightning strikes each one through the water.' },   // v418 AB
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
// v435 AN: every Zodiac Anima fights for 30 s of active time in every form (counted from when it is combat-ready, not during its
// entrance), with no cooldowns on its powers; then it stops attacking, unleashes its Astral Awakening once and leaves when that is done.
// The forms still differ in power and size
const ANIMA_POWER = [0, 1.6, 2.5, 3.6], ANIMA_DUR = [0, 30, 30, 30], ANIMA_SIZE = [0, 2.1, 2.6, 3.1];
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
  cancer: { bpm: 84, root: 165, wave: 'sine', bwave: 'triangle', lead: [0, 7, 12, null, 10, 7, 3, null, 0, 3, 7, 12, 15, null, 12, 10], bass: [0, 0, 0, 0, -4, -4, -4, -4, -2, -2, -2, -2, -5, -5, -5, -5] },   // v418 AB: a slow, sacred minor hymn
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
