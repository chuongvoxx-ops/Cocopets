/* (a guard: an effect's ring shrinking to nothing could hand ellipse() a tiny negative radius, which throws and drops
   the frame; clamp the radii instead) */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype._ellSafe) { const E0 = CanvasRenderingContext2D.prototype.ellipse; CanvasRenderingContext2D.prototype.ellipse = function (x, y, rx, ry, ...rest) { return E0.call(this, x, y, rx > 0 ? rx : 0, ry > 0 ? ry : 0, ...rest); }; CanvasRenderingContext2D.prototype._ellSafe = true; }
/* ---------- Elemental moves: ten Strong attacks and ten Ultimates for each of the eight elements ----------
   Every pet belongs to one of the eight elements (its coat decides; petElement). It can learn that element's moves:
   the Strongs unlock as its Dungeon level rises (ELEM_STRONG_LV), the Ultimates likewise (ELEM_ULT_LV) but only a
   five- or six-star pet may ever learn, equip or cast one. A learned move is equipped into a Strong slot or the Ult slot
   from the Ability cards screen like a card: the deck holds its id ('e:' + element + ':' + key). The pet's own innate
   moves and its ability cards stay exactly as they were.
   The moves themselves live in the element files (20k2-elem-*.js), one function per move, run through the toolkit
   DunElem builds from the Tower game's context (the same one the star moves use, plus geometry, pulls that respect
   bosses, pet-side warnings and drawing helpers). Everything a move leaves behind lives in its fx list, cleaned up with
   the game. st.lowFx ("Fewer effects" in Settings) thins the decorative particles; shapes, warnings and hits stay. */
const ELEM_STRONG_LV = [1, 1, 3, 6, 10, 15, 20, 30, 40, 50], ELEM_ULT_LV = [1, 5, 10, 15, 20, 30, 40, 50, 60, 75];
/* an elemental Ultimate's new name at Celestial (stage 7), where it has one */
const ELEM_ULT_PLUS = { armageddon: 'Super Armageddon' };
/* elemental Strong attacks hit three times as hard as first built (the user found them weak) */
const ELEM_STRONG_MULT = 3;
const ELEM_ULT_STARS = 5;
/* an element's name as the ELEMENTS (ability) key its hits carry, so the reactions read them as that element */
const ELEM_AB = { wind: 'wind', fire: 'fire', ice: 'ice', water: 'water', thunder: 'thunder', earth: 'earth', dark: 'dark', light: 'light' };
Object.assign(ELEMENTS, {
  wind: { name: 'Wind', color: '#8FE8C8', core: '#F2FFF9', dark: '#2E8C78' }, ice: { name: 'Ice', color: '#9FE0F8', core: '#FFFFFF', dark: '#2F80B7' },
  water: { name: 'Water', color: '#4FA8F0', core: '#DFF4FF', dark: '#1F5FA8' }, thunder: { name: 'Lightning', color: '#FFD447', core: '#FFFFFF', dark: '#B7860B' },
  earth: { name: 'Earth', color: '#D4A054', core: '#FFE9B8', dark: '#7A5218' }, dark: { name: 'Dark', color: '#9C88D6', core: '#EDE6FF', dark: '#3B2F63' },
  light: { name: 'Light', color: '#FFF0A0', core: '#FFFFFF', dark: '#B89A30' } });
Object.assign(E8_OF, { wind: 'wind', ice: 'ice', water: 'water', thunder: 'thunder', earth: 'earth', dark: 'dark', light: 'light' });
/* the moves: [key, name, glyph, cost, cooldown, description], ten Strongs then ten Ults an element, in unlock order */
const ELEM_MOVES = {
  earth: { strong: [
    ['faultline', 'Faultline Fang', 'thorns', 24, 2.6, 'Stamp: a glowing crack races ahead and stone teeth erupt along it, one after another.'],
    ['rosary', 'Boulder Rosary', 'orbit', 26, 3, 'Five stones rise into orbit round you, then fire one by one at the nearest monster, spinning faster as they go.'],
    ['amber', 'Amber Breaker', 'gem', 24, 2.4, 'A wedge of amber grows ahead of you and is thrust forward; its tip shatters into golden splinters.'],
    ['quarry', 'Quarry Wheel', 'boom', 26, 2.8, 'Stone segments lock into a wheel that rolls ahead, crushing all along its way.'],
    ['geode', 'Geode Burst', 'burst', 26, 3, 'A dark geode rises where you aim, cracks with coloured light, then splits into a burst of shards.'],
    ['talons', 'Terracotta Talons', 'claw', 24, 2.6, 'Three stone claws sweep out of the ground ahead; the last crosses the first two.'],
    ['sandglass', 'Sandglass Snare', 'hourglass', 26, 3.4, 'Sand streams into a ring that slows and scours the monsters inside, then bursts upward.'],
    ['basalt', 'Basalt Knuckle', 'hammer', 26, 2.8, 'Dark blocks stack into a huge fist beside you; it punches a short line and shoves monsters back.'],
    ['cairn', 'Skipping Cairn', 'slam', 24, 2.6, 'A flat stone skips three times toward your aim, each bounce a ring of pebbles and a blow.'],
    ['rebuttal', "Mountain's Rebuttal", 'shield', 28, 3.6, 'Slabs rise round you and guard you for a moment, then tilt out and slam down as a shockwave.'] ],
  ult: [
    ['cathedral', 'Cathedral of Stone', 'hammer', 90, 18, 'Six pillars rise round the aim, arches build between them and collapse inward, blow after blow, to a crystal eruption.'],
    ['worldspine', 'Worldspine Procession', 'thorns', 90, 18, 'A mountain ridge travels forward under the floor: rock vertebrae rise and strike in turn, and the last unfolds into a crown of slabs.'],
    ['celestialgeode', 'Celestial Geode', 'gem', 95, 18, 'A vast geode forms above the aim, opens in turning sections, and drops its crystals in sequence before the shell breaks as a ring.'],
    ['footfall', 'Colossus Footfall', 'slam', 95, 18, 'A stone colossus forms behind you; one leg lifts and stamps the aim, fractures racing outward with delayed eruptions.'],
    ['kingdom', 'Kingdom Beneath', 'hammer', 90, 18, 'A buried city shows through the floor: its towers rise one by one to strike, then topple toward a central monument.'],
    ['saturn', 'Saturn of Shale', 'orbit', 95, 20, 'Rings of slate orbit a stone core overhead, tilt, and descend in three sweeps before the core strikes the centre.'],
    ['amberepoch', 'Amber Epoch', 'gem', 95, 20, 'Golden resin branches up round the monsters and hardens into a crystal enclosure that fractures in a chain of blows.'],
    ['divide', 'Continental Divide', 'twin', 95, 20, 'Two stone ridges rise along the aimed corridor and grind inward in pulses; a final rupture throws slabs above it.'],
    ['mandala', 'Thousand-Peak Mandala', 'nova', 100, 22, 'Rings of stone spires emerge round the aim, turn, and erupt inward; a central peak rises and shatters outward.'],
    ['mountainheart', 'Heart of the Mountain', 'meteor', 100, 22, 'A molten core rises beneath you wrapped in plates of earth that open with every seismic pulse, then crown and slam outward.'] ] },
  wind: { strong: [
    ['silkstream', 'Silkstream Cutter', 'crescent', 24, 2.4, 'Two ribbons of air braid together and unfurl into a crescent that pierces a line of monsters.'],
    ['courier', 'Spiral Courier', 'wave', 24, 2.6, 'A corkscrew gust curves to the target and delivers several quick hits on arrival.'],
    ['updraft', 'Updraft Crown', 'spin', 26, 3, 'A ring of gusts erupts under the aim, curving inward like a crown, and lifts the monsters caught in it.'],
    ['shears', 'Crosswind Shears', 'twin', 26, 2.8, 'Two currents sweep diagonally across the aim; where they cross, a pressure burst.'],
    ['pearl', 'Vacuum Pearl', 'orb', 26, 3.2, 'A compressed sphere of air drifts forward, pulling monsters along, then pops into a pressure ring.'],
    ['galestair', 'Gale Stair', 'dash', 24, 2.6, 'Three gust platforms rise along the aim, each striking a wider area than the last.'],
    ['featherstorm', 'Featherstorm Fan', 'fan', 24, 2.4, 'A fan of feather-shaped air blades, the outer ones curving inward.'],
    ['zephyr', 'Returning Zephyr', 'boom', 26, 2.8, 'A ring of wind flies out and curves back to you: a broad sweep going, a narrow strong cut returning.'],
    ['needle', 'Pressure Needle', 'lance', 26, 2.6, 'Air compresses to a point before you and fires as a piercing lance; dust ripples follow its route.'],
    ['tailwind', 'Tailwind Sweep', 'spin', 24, 2.8, 'Spin: a low crescent sweeps round you and out, and a tailwind quickens your steps for a moment.'] ],
  ult: [
    ['skypalace', 'Palace of the Sky', 'wave', 90, 18, 'Ribbons rise into a pavilion of moving air over the aim; its arches unfold into currents that strike in sequence, then it opens like an umbrella.'],
    ['migration', 'Thousand-Wing Migration', 'feather', 90, 18, 'A flock of wind-birds forms behind you, spirals overhead and dives through the monsters in waves, then merges into one great bird.'],
    ['tempest', 'Eye of the Tempest', 'vortex', 95, 20, 'Small vortices circle a clear eye, drawing monsters toward its ring, then merge into a storm wall that collapses outward.'],
    ['loom', 'Loom of the Heavens', 'thorns', 95, 18, 'Air ribbons weave a lattice between pressure nodes; its rows sweep down as cutting currents before unravelling into one surge.'],
    ['severance', 'Horizon Severance', 'crescent', 95, 20, 'Crescents stack behind a line of compressed air and release as staggered travelling blades, each wider than the last.'],
    ['dandelion', 'Dandelion Cyclone', 'spin', 90, 18, 'A seed-like core rises amid hundreds of tufts that scatter into spirals, converge on the monsters, then gust across the ground.'],
    ['giantbow', "Invisible Giant's Bow", 'lance', 100, 20, 'Air bends into a colossal bow above you; its release fires a vast corkscrew lance down the aimed corridor with pressure bursts behind it.'],
    ['carousel', 'Skyfall Carousel', 'orbit', 95, 20, 'Six funnels descend round the aim and turn like a carousel, sweeping the ground, then converge into a towering updraft.'],
    ['breath', 'Breath Between Mountains', 'wave', 95, 20, 'Two walls of air form beside a wide corridor; a sustained gale tears down it in pulses, ending in a rolling gust.'],
    ['hurricane', 'Crownless Hurricane', 'spin', 100, 22, 'A ring of wind blades follows you for a while, launching crescents, then expands into a broad sweep.'] ] },
  light: { strong: [
    ['prismpetal', 'Prism Petal', 'gem', 24, 2.4, 'Three crystal plates unfold ahead and refract a beam into rays that fan across the monsters.'],
    ['dawnspear', 'Dawnstep Spear', 'lance', 24, 2.6, 'A spear of light assembles and fires along your aim, opening into a four-pointed star on impact.'],
    ['halo', 'Halo Ricochet', 'orbit', 26, 2.8, 'A spinning halo rebounds between nearby monsters, thinner with every bounce.'],
    ['lanternfall', 'Lanternfall', 'beam', 26, 3, 'Three lanterns appear over the aim and drop columns of warm light in a three-beat rhythm.'],
    ['stitch', 'Radiant Stitch', 'thorns', 24, 2.6, 'A needle of light pierces forward leaving luminous points; a thread snaps between them for a second cut.'],
    ['mirrorwing', 'Mirrorwing Sweep', 'feather', 26, 2.8, 'Two mirrored wings unfold beside you and sweep forward in a broad cone.'],
    ['sunseed', 'Sunseed', 'burst', 26, 3, 'A golden seed lands where you aim, sprouts a radiant stalk and bursts into a flash of rays.'],
    ['lucentwheel', 'Lucent Wheel', 'boom', 26, 2.8, 'A segmented disc of light rolls ahead, then unfolds flat into a circle of light.'],
    ['chime', 'Cathedral Chime', 'nova', 26, 3.2, 'A bell of light swings over you and a ring of silent sound expands across the monsters nearby.'],
    ['starpoint', 'Starpoint Volley', 'stars', 24, 2.6, 'Five points form a constellation at your brow and fire lances one by one; the last bursts as a star.'] ],
  ult: [
    ['rainbowheart', 'Rainbow Heart Attack', 'spin', 95, 20, 'Massive glowing pink hearts spin like tops and glide through the battlefield trailing strings of pastel light: 1 heart, 2 at Adept, 3 at Celestial.'],
    ['sunflare', 'Sunflare', 'nova', 95, 20, 'A massive pink love heart hovers over the battlefield for seven seconds, flooding the monsters below with radiant light while hearts and stars float round its beam.'],
    ['holyjudgement', 'Holy Judgement', 'stars', 95, 20, 'A fan of pink homing lights launches into the sky and falls on the monsters in bursts of glowing love hearts: 20, 30 at Adept, 40 at Celestial.'],
    ['seraphic', 'Seraphic Refraction', 'feather', 95, 20, 'A many-winged construct forms behind you; its wings redirect beams onto the aim, then fold forward in a prismatic sweep.'],
    ['guilloche', 'Daybreak Guilloche', 'nova', 95, 20, 'Lines of light draw a looping pattern on the floor; arcs rise from it, pulses run along it, then it lifts and detonates.'],
    ['mirrors', 'Palace of Mirrors', 'gem', 95, 20, 'Tall mirrors circle the aim; a lance ricochets between them crossing the monsters, then all fire together downward.'],
    ['solarengine', 'Solar Bloom Engine', 'burst', 95, 20, 'A mechanical sun of plates forms over you, slides open layer by layer, fires broad rays, then throws its plates as crescents.'],
    ['verdict', 'Constellation Verdict', 'stars', 100, 22, 'Stars appear over the monsters and connect; each line sends a pulse down, then a greater star drops a pillar.'],
    ['heavenriver', 'River of Heaven', 'wave', 95, 20, 'A ribbon of golden light winds along the aim, dipping to strike section by section, then rises as a shimmering curtain.'],
    ['unsettingsun', 'Crown of the Unsetting Sun', 'nova', 100, 22, 'A vast crown turns over the aim casting spokes of light; its segments descend as strikes and the halo expands as a final wave.'] ] },
  dark: { strong: [
    ['inkfang', 'Inkfang', 'claw', 24, 2.4, 'A drop of darkness stretches into a fang and lunges low; it splashes into ribbons that retract.'],
    ['eclipsedisc', 'Eclipse Disc', 'boom', 24, 2.6, 'A black disc with a violet rim slides along your aim through the monsters, then turns edge-on and collapses.'],
    ['hem', 'Shadow Hem', 'crescent', 26, 2.8, 'A dark ribbon draws a curve on the ground, then rises as a cutting curtain.'],
    ['hollowlantern', 'Hollow Lantern', 'vortex', 26, 3, 'A dark lantern opens over the aim on a tiny void that leans the monsters in, then pulses.'],
    ['nightneedle', 'Nightneedle Cluster', 'fan', 24, 2.6, 'Shadow needles gather round you at uneven heights and launch in a staggered spread.'],
    ['undertow', 'Velvet Undertow', 'wave', 26, 2.8, 'A low wave of flowing darkness rolls forward, its folded edges dragging monsters along.'],
    ['ravenfold', 'Ravenfold', 'feather', 24, 2.6, 'Three ravens unfold from your shadow and dart at the target; the last leaves an open-wing trail.'],
    ['umbralhook', 'Umbral Hook', 'thorns', 26, 2.8, 'A crescent hook flies out on an ink tether, bites, and drags the monster to you.'],
    ['blackglass', 'Blackglass Fracture', 'gem', 26, 2.8, 'A dark pane appears at the aim, cracks with violet light and snaps into a cone of shards.'],
    ['double', 'Midnight Double', 'twin', 26, 3, 'A shadow echo copies your pose; you strike forward, and the echo repeats it wider.'] ],
  ult: [
    ['hollowmoon', 'Eclipse of the Hollow Moon', 'nova', 90, 18, 'A great dark sphere forms over the aim ringed by a silver corona; pulses hammer the ground beneath, then it collapses into one expanding ring.'],
    ['inkpalace', 'Palace of Ink', 'wave', 90, 18, 'Panels of liquid shadow fold into a roofless palace round the aim; tendrils sweep its floor, then it folds in panel by panel to a central splash.'],
    ['ravenfuneral', 'Thousand-Raven Funeral', 'feather', 95, 20, 'A shadow spreads under the aim and releases flocks of ravens that dive through lanes, then merge into one winged shape.'],
    ['abyssorrery', 'Abyssal Orrery', 'orbit', 95, 20, 'Black rings orbit an empty centre; void nodes fire converging lances, and the orbits tighten into an implosion.'],
    ['lastnight', 'Curtain of the Last Night', 'crescent', 95, 20, 'Dark curtains descend round the aim and twist into blades sweeping inward in pairs; the last pair parts on a starless void.'],
    ['forgottenkings', 'Crown of Forgotten Kings', 'hammer', 95, 20, 'Broken crown segments orbit a shadow pillar, each casting a cutting shadow across the floor, then assemble and drop.'],
    ['leviathan', 'Leviathan Beneath the Floor', 'dragon', 100, 22, 'A serpentine shadow moves under the aim; arches of its body breach the floor as waves, and its head rises and sweeps.'],
    ['blackrose', 'Black Rose Compass', 'thorns', 95, 20, 'Four thorn-needles form round the aim and strike inward in pairs; a rose of folded shadow opens for the final burst.'],
    ['noreflection', 'Night Without Reflection', 'twin', 95, 20, 'Dark mirrors appear round the monsters holding echoes that step out and strike together, then fracture inward.'],
    ['eventide', 'Eventide Spiral', 'vortex', 100, 22, 'A towering corkscrew of darkness forms at the aim; it unwinds from the top, each coil an expanding wave.'] ] },
  fire: { strong: [
    ['emberkoi', 'Ember Koi', 'twin', 24, 2.4, 'Two fish of flame circle you, then swim through the air to the target and cross in a spiral burst.'],
    ['cinderfan', 'Cinder Wave', 'wave', 24, 2.4, 'A ring of fire rolls out all around you in a burning wave, scattering embers and sparks; it grows into more waves as your pet evolves.'],
    ['furnaceseed', 'Furnace Seed', 'burst', 26, 3, 'A glowing coal lands at the aim, cracks as heat builds, and erupts; the ground burns a while.'],
    ['moltenlash', 'Molten Lash', 'crescent', 24, 2.6, 'A ribbon of molten fire whips across the aimed arc and snaps at its tip.'],
    ['phoenixtalon', 'Phoenix Talon', 'claw', 26, 2.8, 'Three flaming claw marks fall across the aim and flare where they cross.'],
    ['firewheel', 'Firewheel Skip', 'boom', 24, 2.6, 'A spinning wheel of flame bounces along the ground, scorching at each contact.'],
    ['mandala', 'Burning Mandala', 'flower', 26, 2.8, 'A blazing mandala opens behind you and you fire glowing rings of fire at the monsters: 8 rings, 12 from Adept, 18 at Celestial.'],
    ['salamander', 'Salamander Rush', 'dash', 24, 2.6, 'A salamander of flame darts along your aim, weaving, and coils into an explosion at the end.'],
    ['hearthburst', 'Hearthburst', 'nova', 26, 2.8, 'Flames gather at your feet and roll outward as a low circular wave.'],
    ['matchstars', 'Falling Matchstars', 'stars', 26, 3, 'Sparks fan upward and fall on three marked spots as tiny comets.'] ],
  ult: [
    ['armageddon', 'Armageddon', 'flame', 90, 18, 'A towering tornado of fire roars across the battlefield, dragging monsters into its burning spiral and leaving scorched earth behind. At Celestial it becomes Super Armageddon: four great fire tornadoes.'],
    ['embers', 'Festival of a Thousand Embers', 'stars', 90, 18, 'Fire lanterns rise in tiers over the aim and open in turn, raining grouped sparks on marked spots, then burst together.'],
    ['crucible', 'Solar Crucible', 'burst', 95, 20, 'A bowl of molten plates forms over the aim holding a fire core; flames pour through, then the plates open and drop it.'],
    ['dragonkiln', 'Dragonkiln Procession', 'dragon', 100, 22, 'Furnace rings appear along the aim; a flame dragon threads them, growing at each, and coils round the last to detonate.'],
    ['crimsonlotus', 'Crimson Lotus Forge', 'flower', 95, 20, 'Molten petals rise round the aim and unfold into a fire lotus; its bud erupts last.'],
    ['infernocarousel', 'Inferno Carousel', 'orbit', 95, 20, 'Flame blades orbit a column at several heights; the column compresses and flings them out ring by ring.'],
    ['fallingsuns', 'Crown of Falling Suns', 'meteor', 95, 20, 'Blazing spheres gather into a crown overhead, each falling on a marked spot, then the crown itself descends.'],
    ['apocalypse', 'Apocalypse', 'nova', 100, 22, 'A huge red fireball gathers over the aim, then explodes in a magical blast of fire and fireworks: the strongest fire there is.'],
    ['ninetails', 'Nine-Tailed Conflagration', 'claw', 100, 22, 'Nine flame tails unfurl behind you and lash the ground ahead one by one, then braid into one spiral lance.'],
    ['paperflames', 'World of Paper Flames', 'flame', 95, 20, 'Sheets of flame unfold into banners round the aim and sweep the monsters as their edges burn, then fold into one shape and burst.'] ] },
  water: { strong: [
    ['ribbonfin', 'Ribbonfin', 'wave', 24, 2.4, 'A water ribbon curls into a fish and darts forward; it wraps the target once and bursts.'],
    ['tideglass', 'Tideglass Orb', 'orb', 24, 2.6, 'A clear sphere of water rolls slowly through the monsters, then stretches up and splashes.'],
    ['crescenttide', 'Crescent Tide', 'crescent', 26, 2.8, 'Crescent water sheets orbit you, then peel away through the monsters: more crescents as you evolve.'],
    ['rainneedle', 'Rainneedle Fan', 'fan', 24, 2.6, 'A sheet of water hangs before you and separates into a fan of piercing needles.'],
    ['whirlpool', 'Whirlpool Step', 'vortex', 26, 3.2, 'A spiral pool turns at the aim, drawing monsters in and scouring them, then a column rises and collapses.'],
    ['bubblesnare', 'Bubble Spray', 'bubbles', 26, 3, 'A great bubble floats to the target and encloses the monsters there, slowing them until it pops.'],
    ['waterwheel', 'Waterwheel Strike', 'boom', 26, 2.8, 'Curved blades of water form a wheel that surges forward, striking as it rolls.'],
    ['twinundertow', 'Twin Undertow', 'twin', 26, 2.8, 'Two streams travel either side of your aim and curve together in an upward splash.'],
    ['pearlburst', 'Pearlburst Volley', 'volley', 24, 2.6, 'Three pearls of water hover beside you and fire one by one, droplets scattering on impact.'],
    ['basin', 'Falling Basin', 'slam', 26, 3, 'A floating bowl of water forms over the aim and tips, pouring down as a waterfall.'] ],
  ult: [
    ['mayhem', 'Mayhem', 'wave', 100, 21, 'Catastrophe in water: sweeping columns of swirling water fall from the sky and rove the battlefield, rings surging and bubbles bursting.'],
    ['lotusbloom', 'Lotus Bloom', 'flower', 95, 20, 'A giant rotating lotus of water blooms and bursts again and again where it was cast: six bursts at Celestial, the last the biggest.'],
    ['aquaillusion', 'Shiny Aqua Illusion', 'stars', 95, 26, 'A starry dark-water field curses every monster on it: held still, taking 20% more damage, then bursting for 20% of what it took. 5 s, 7 s at Adept, 10 s at Celestial.'],
    ['deepbluesea', 'Deep Blue Sea', 'orbit', 100, 22, 'Ringed spheres of luminous water, like tiny ocean planets, sweep through the arena and devastate the monsters in their path: 1 sphere, 3 at Adept, 5 at Celestial.'],
    ['rhapsody', 'Aqua Rhapsody', 'bubbles', 90, 24, 'Luminous strings, floating notes and water ripples gently heal you over time: 16 s at Celestial.'],
    ['abyssalspiral', 'Abyssal Spiral', 'vortex', 95, 20, 'A deep-blue whirlpool lifts a hollow tower of spiralling water ribbons, drawing monsters in, then collapses inward into a pressure burst: seven ribbons at Celestial.'],
    ['bubblereverie', 'Bubble Reverie', 'bubbles', 90, 18, 'Large pearlescent bubbles gather in floating arcs round you, then launch along curved paths and burst on the monsters: eighteen at Celestial.'],
    ['heavenfall', 'Heavenfall', 'beam', 95, 20, 'Huge luminous rings open overhead and pour powerful waterfalls onto the monsters: five in a sweeping cascade at Celestial.'],
    ['neptunetrident', "Neptune's Trident", 'lance', 100, 22, 'A giant trident emerges from a rippling sky and plunges into the ground, cracking it open in a vast water explosion; at Celestial ten smaller tridents rain down after it.'],
    ['jellyfish', 'Jellyfish Aurora', 'bubbles', 95, 20, 'Giant jellyfish of water descend over the aim, tendrils sweeping lanes beneath; their bells contract together.'] ] },
  ice: { strong: [
    ['antler', 'Crystal Antler', 'thorns', 24, 2.4, 'Branching ice antlers grow along a short path ahead and shatter outward.'],
    ['skate', 'Glacier Skate', 'crescent', 24, 2.6, 'A smooth blade of ice slides low across the floor, then tilts up and fractures into a fan.'],
    ['snowbell', 'Snowglass Bell', 'burst', 26, 3, 'A thin bell of ice forms over the aim; a frost ring climbs it, and it cracks into curved fragments.'],
    ['frostloom', 'Frostneedle Loom', 'fan', 24, 2.6, 'Two staggered rows of ice needles fire alternately in a woven pattern.'],
    ['snowfall', 'Thousand-Wing Snowfall', 'feather', 26, 2.8, 'Crystal moths rise from a column of snow and dive in waves as shards; the rest form two great wings that close and shatter.'],
    ['rimecoil', 'Rimecoil', 'vortex', 26, 3, 'A ribbon of frost winds up the target growing crystal plates that slow it, then snap outward. At Celestial it is three times the size.'],
    ['pendulum', 'Icicle Pendulum', 'hammer', 26, 2.8, 'A long icicle swings forward through a broad arc and shatters at its lowest point.'],
    ['dominoes', 'Polar Dominoes', 'twin', 26, 2.8, 'A line of ice plates rises toward the aim and topples in a chain of shattering blows.'],
    ['hoarfrost', 'Hoarfrost Halo', 'spin', 26, 2.8, 'A ring of ice blades turns once round you, then expands outward.'],
    ['absolutewinter', 'Heart of Absolute Winter', 'snow', 28, 3, 'A faceted ice heart beats above the aim, each pulse frosting the ground and raising crystals; it opens on a core that releases the last wave.'] ],
  ult: [
    ['frozenorrery', 'Frozen Orrery', 'orbit', 95, 20, 'Nested rings of ice turn round a blue core, detach and sweep down; the core splits into icicles that fall in turn. At Celestial: three times bigger, a far wider area, three times the damage.'],
    ['diamonddust', 'Diamond Dust', 'vortex', 90, 18, 'A frost spiral blooms into a spinning ice flower inside a travelling cyclone of diamonds: 1 vortex, 2 at Adept, 3 enormous ones at Celestial.'],
    ['frozenswords', 'Frozen Swords', 'lance', 95, 20, 'Colossal swords of ice crystallise overhead and impale the ground, sending waves of ice out: 2 swords, 3 at Adept, 5 at Celestial with a giant last blade.'],
    ['letitgo', 'Let It Go', 'orb', 95, 20, 'A giant orb of ice hovers over a freezing field and fires icy rays at the monsters: 5 s, 8 s at Adept, 12 s at Celestial.'],
    ['absolutezero', 'Absolute Zero', 'beam', 95, 20, 'A giant crystal forms above you inside turning rings of ice and fires a massive frost beam.'],
    ['glacialonslaught', 'Glacial Onslaught', 'gem', 95, 20, 'Huge spinning ice crystals launch from behind you in waves and burst into fans of shards: 3, 5 at Adept, 9 at Celestial.'],
    ['frozensingularity', 'Frozen Singularity', 'nova', 95, 20, 'Ice rings compress a crystal core until it detonates in a broad wave of ice: 2 rings, 3 at Adept, 5 at Celestial.'],
    ['frozenvortex', 'Frozen Vortex', 'vortex', 95, 20, 'A swirling vortex of cold ice blades drives forward, slicing through the monsters: 1 vortex, 4 at Celestial lasting 3 s longer.'],
    ['catastrophe', 'Catastrophe', 'snow', 100, 21, 'Swirling beams of ice light fall from the sky and sweep the battlefield while snow falls: 5 s, 10 beams for 10 s at Celestial.'],
    ['iceage', 'Ice Age', 'meteor', 100, 22, 'A giant crystal falls from the sky and bursts in waves of blue light; crystals sprout from the ground for more damage and freeze for 3 s. The ultimate ice spell.'] ] },
  thunder: { strong: [
    ['forkedfang', 'Forked Fang', 'twin', 24, 2.4, 'Two lances of lightning twist round one path and split before impact, or converge on one monster.'],
    ['stormbead', 'Stormbead Chain', 'bolt', 26, 2.8, 'Charged beads form round the target and discharge from monster to monster.'],
    ['voltscythe', 'Volt Scythe', 'crescent', 24, 2.6, 'A curved blade of lightning forms along your sweep and travels a short way as a cone.'],
    ['thunderpin', 'Thunderpin', 'lance', 26, 3, 'A charged spike lands at the aim; arcs crawl down it and it sends three pulses into the ground around.'],
    ['railflash', 'Railflash', 'beam', 26, 2.8, 'Two rails of light appear along the aim and a bolt races between them, piercing everything.'],
    ['staticblossom', 'Static Blossom', 'flower', 26, 3, 'Electrical branches sprout from a point on the ground into a network, and one pulse runs through it.'],
    ['arcboomerang', 'Arc Boomerang', 'boom', 26, 2.8, 'A V of plasma flies out turning slowly and curves back to you, striking both ways.'],
    ['sparkstep', 'Sparkstep Echo', 'dash', 24, 2.6, 'You dash with a short strike; a charged outline stays where you stood and detonates.'],
    ['capacitor', 'Capacitor Crush', 'hammer', 26, 3, 'Two charged plates appear either side of the target and close, arcing, then clap together.'],
    ['stormthread', 'Stormthread Volley', 'volley', 24, 2.6, 'Threads tie you to needles hovering ahead; they fire in quick succession, the last a branching star.'] ],
  ult: [
    ['flash', 'Lightning Flash', 'dash', 90, 18, 'You crouch, charge and launch through the monsters in lightning dashes, each leaving a plasma ribbon and an afterimage: 4 dashes, 8 at Adept, 16 at Celestial.'],
    ['thunderstorm', 'Thunderstorm', 'bolt', 95, 20, "A storm canopy gathers over the aim; tendrils rise to meet bolts falling in a building rhythm, then a great finishing strike: 6, 10, 16 at Celestial through the storm's eye."],
    ['widepressure', 'Sparkling Wide Pressure', 'spin', 90, 18, 'Rolling thunder wheels launch in a staggered fan, weaving through the monsters and spraying sparks: 4 wheels, 10 at Adept, 16 at Celestial.'],
    ['ragnarok', 'Ragnarok', 'hammer', 100, 22, 'A colossal spirit hammer of lightning assembles over the aim and swings down: one immense electric explosion that paralyses for 10 seconds.'],
    ['supreme', 'Supreme Thunder', 'orbit', 95, 20, 'Living lightning spheres orbit you for 10 seconds, darting out to zap monsters that come close: 4 spheres, 8 at Adept, 12 at Celestial.'],
    ['glory', 'Edge of Glory', 'crescent', 95, 20, 'Two immense wings of lightning blades unfold behind you, sweep the monsters and cross into a travelling X-slash: more feathers and sweeps as you evolve.'],
    ['heavensbow', "Heaven's Bow", 'lance', 95, 20, 'A gigantic bow of lightning forms beside you: a fan of arrows, then one immense piercing arrow: 3 arrows, 5 at Adept, 9 at Celestial.'],
    ['lotus', 'Thunder Lotus', 'flower', 95, 20, 'A seed of lightning grows into a vast lotus of electricity round the monsters; pulses climb its petals: 6 petals, 2 rings at Adept, 3 at Celestial.'],
    ['butterfly', 'Butterfly Tempest', 'feather', 95, 20, 'Razor-winged lightning butterflies spiral up and strike, then join into one great butterfly: 6, 12 at Adept, 24 at Celestial.'],
    ['worldsplitter', 'Worldsplitter', 'beam', 100, 22, 'You strike the ground: a fault runs through the monsters, then erupts outward as a travelling curtain of lightning: more branches as you evolve.'] ] },
};
const ELEM_LIST = {}; for (const e in ELEM_MOVES) { ELEM_LIST[e] = {}; for (const s of ['strong', 'ult']) ELEM_MOVES[e][s].forEach((row, i) => { ELEM_LIST[e][(s === 'ult' ? 'ey_' : 'ex_') + row[0]] = { el: e, slot: s, key: row[0], i, name: row[1], glyph: row[2], cost: row[3], cd: row[4], desc: row[5], lv: (s === 'ult' ? ELEM_ULT_LV : ELEM_STRONG_LV)[i] }; }); }
const elemId = (el, key) => `e:${el}:${key}`;
const elemParse = id => { if (typeof id !== 'string' || id.slice(0, 2) !== 'e:') return null; const [, el, key] = id.split(':'); const M = ELEM_LIST[el]; if (!M) return null; return M['ex_' + key] || M['ey_' + key] || null; };
const petStars = p => starsOf(rarityOf(formOf(p)));
/* may this pet learn this move: its own element, its level, and (an Ultimate) its stars */
function elemLock(mv, p) {
  if (!mv || !p) return 'no';
  if (petElement(p) !== mv.el) return 'element';
  if (mv.slot === 'ult' && petStars(p) < ELEM_ULT_STARS) return 'stars';
  if (!(st && st.devMoves) && (p.dlv || 1) < mv.lv) return 'level';
  return '';
}
/* the ability an elemental move is in a pet's kit (like innateAbility / cardAbility) */
function elemAbility(mv, slot, p) {
  const grow = 1 + 0.05 * (((p && p.stage) || 1) - 1), stars = p ? petStars(p) : 3, sm = mv.slot === 'ult' ? (stars >= 6 ? 1.5 : 1.25) : (stars >= 6 ? 1.5 : stars >= 5 ? 1.25 : stars >= 4 ? 1.1 : 1);
  return { slot: slot || mv.slot, own: true, elem: true, id: elemId(mv.el, mv.key), key: (mv.slot === 'ult' ? 'ey_' : 'ex_') + mv.key, name: mv.name, glyph: mv.glyph, el: ELEM_AB[mv.el], e8: mv.el, mult: grow * sm * (mv.slot === 'strong' ? ELEM_STRONG_MULT : 1), cost: mv.cost, cd: mv.cd, desc: mv.desc, lv: mv.lv, star: stars, evo: (p && p.stage) || 1 };
}
const elemMovesFor = (p, slot) => Object.values(ELEM_LIST[petElement(p)] || {}).filter(m => m.slot === slot);

/* ---------- the toolkit and the runner ---------- */
const ELEM_IMPL = {};   // ELEM_IMPL[element] = { strong: { key(C, H) }, ult: { key(C, H) } }, filled by the element files
const DunElem = (() => {
  const TAU = Math.PI * 2;
  function create(X) {
    const me = X.me, g = X.g, mons = X.mons, fx = [];
    const Q = () => (st && st.lowFx ? 0.35 : 1), n = k => Math.max(1, Math.round(k * Q()));
    const living = () => mons.filter(m => !m.dead && !m.under && !m.falling && !m.fobj);
    const near = (x, y, r) => living().filter(m => Math.hypot(m.x - x, m.y - y) < r + m.r);
    const sortNear = (x, y, list) => (list || living()).slice().sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y));
    const sp = (a, v) => [Math.cos(a) * v, Math.sin(a) * v];
    const add = o => { const f = Object.assign({ t: 0, life: 1 }, o); fx.push(f); return f; };
    const rgba = (h, a) => { const [r, g2, b] = hexRGB(h); return `rgba(${r},${g2},${b},${Math.max(0, Math.min(1, a))})`; };
    const angTo = (x, y, x2, y2) => Math.atan2(y2 - y, x2 - x);
    const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
    const walk = (x, y) => X.walkPoint(x, y, me);
    /* --- hits by shape (every monster once per call) --- */
    const hitArea = (x, y, r, dmg, o) => X.hitArea(x, y, r, dmg, o);
    function hitLine(x, y, a, len, w, dmg, o) { let k = 0; for (const m of living()) { const rx = m.x - x, ry = m.y - y, al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > -m.r && al < len + m.r && of < w / 2 + m.r) { X.hitMon(m, dmg, o); k++; } } return k; }
    function hitCone(x, y, a, len, spread, dmg, o) { let k = 0; for (const m of living()) { const d = Math.hypot(m.x - x, m.y - y); if (d < len + m.r && Math.abs(wrap(angTo(x, y, m.x, m.y) - a)) < spread + (d > 0.1 ? Math.asin(Math.min(1, m.r / Math.max(d, m.r))) * 0.6 : 1)) { X.hitMon(m, dmg, o); k++; } } return k; }
    function hitRing(x, y, r0, r1, dmg, o) { let k = 0; for (const m of living()) { const d = Math.hypot(m.x - x, m.y - y); if (d + m.r > r0 && d - m.r < r1) { X.hitMon(m, dmg, o); k++; } } return k; }
    /* --- control that respects a boss (no displacement, shorter slows); a monster's `still` stays put --- */
    function pull(m, x, y, step) { if (m.boss || m.still || m.dead) return false; const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy); if (d < 0.25) return false; const s = Math.min(step, d); X.moveEnt(m, dx / d * s, dy / d * s, 0); return true; }
    function push(m, x, y, step) { if (m.boss || m.still || m.dead) return false; const dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy) || 1; X.moveEnt(m, dx / d * step, dy / d * step, 0); return true; }
    function slow(m, t) { if (m.dead) return; m.chill = Math.max(m.chill || 0, m.boss ? Math.min(t, 1.2) : t); }
    function lift(m, t, h) { if (m.dead) return; if (m.boss || m.still) { m.stun = Math.max(m.stun || 0, t * 0.25); return; } m.stun = Math.max(m.stun || 0, t + 0.2); if (m.hop || m.lifted) return; m.lifted = true;
      add({ life: t, update(dt, f) { if (m.dead) { f.life = 0; return; } m.z = Math.sin(Math.min(1, f.t / t) * Math.PI) * (h || 1.2); }, onEnd() { m.z = 0; m.lifted = false; } }); }
    function bind(m, t) { if (m.dead) return; if (m.boss) m.chill = Math.max(m.chill || 0, Math.min(t, 1.5)); else m.freeze = Math.max(m.freeze || 0, t); }
    /* --- pet-side warnings (the element's colour: never the red of a monster's) --- */
    const warn = (x, y, r, life, col, fn) => X.zones.push({ kind: 'warn', x, y, r, life, max: life, own: 'pet', color: col, fn });
    const warnLine = (x, y, a, len, w, life, col, fn) => X.zones.push({ kind: 'warn', shape: 'line', x, y, a, len, w, life, max: life, own: 'pet', color: col, fn });
    const warnCone = (x, y, a, len, spread, life, col, fn) => X.zones.push({ kind: 'warn', shape: 'cone', x, y, a, len, spread, life, max: life, own: 'pet', color: col, fn });
    const fire = (x, y, r, life, dps, el) => X.zones.push({ kind: 'fire', x, y, r, life, max: life, dps, tick: 0, own: 'pet', el: el || 'fire' });
    /* --- particles (thinned by Fewer effects) --- */
    const P = o => X.part(o);
    function burst(x, y, kind, k, o) { for (let i = 0; i < n(k); i++) { const a = Math.random() * TAU, v = (o.v || 5) * (0.4 + Math.random() * 0.8); P(Object.assign({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * (o.flat ? 0.6 : 1) - (o.up || 0), life: (o.life || 0.5) * (0.6 + Math.random() * 0.6), max: o.life || 0.5, size: o.size || 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, g: o.g || 0, drag: o.drag || 0, color: Array.isArray(o.color) ? o.color[i % o.color.length] : o.color }, o.extra || {})); } }
    const glowAt = (x, y, size, life, col, alpha) => P({ kind: 'glow', x, y, vx: 0, vy: 0, life, max: life, size, color: col, alpha });
    const flareAt = (x, y, size, life, col) => P({ kind: 'flare', x, y, vx: 0, vy: 0, life, max: life, size, color: col });
    /* --- drawing: all in screen pixels; T is a tile. The ground is seen from above and ahead: a floor circle is an
       ellipse squashed to 0.55; height above the floor goes up the screen --- */
    const GY = 0.55;
    function floorEllipse(c, x, y, r, ry) { c.beginPath(); c.ellipse(x, y, r, ry != null ? ry : r * GY, 0, 0, TAU); }
    function poly(c, pts, close) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close !== false) c.closePath(); }
    /* a shaded block: top face, a lit side and a dark side, the game's outline */
    function block(c, x, y, w, h, d, top, side, dark) { const g2 = c.createLinearGradient(x - w / 2, y - h, x + w / 2, y); g2.addColorStop(0, side); g2.addColorStop(0.6, side); g2.addColorStop(1, dark); c.fillStyle = g2; c.fillRect(x - w / 2, y - h, w, h); c.fillStyle = dark; c.fillRect(x + w / 2 - w * 0.28, y - h, w * 0.28, h); c.fillStyle = rgba('#FFFFFF', 0.12); c.fillRect(x - w / 2, y - h, w * 0.08, h); const tp = [[x - w / 2, y - h], [x - w / 2 + d, y - h - d * 0.6], [x + w / 2 + d, y - h - d * 0.6], [x + w / 2, y - h]], g3 = c.createLinearGradient(x - w / 2, y - h - d * 0.6, x + w / 2, y - h); g3.addColorStop(0, mix(top, '#FFFFFF', 0.25)); g3.addColorStop(1, top); poly(c, tp); c.fillStyle = g3; c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.strokeRect(x - w / 2, y - h, w, h); poly(c, tp); c.stroke(); }
    /* a wedge / spike standing on the floor at (x, y), h high, w wide at the base, leaning by lean px */
    function spike(c, x, y, w, h, lean, fill, edge) { const g2 = c.createLinearGradient(x - w / 2, y, x + w / 2, y); g2.addColorStop(0, mix(fill, '#FFFFFF', 0.35)); g2.addColorStop(0.45, fill); g2.addColorStop(1, mix(fill, '#000000', 0.45)); poly(c, [[x - w / 2, y], [x + lean, y - h], [x + w / 2, y]]); c.fillStyle = g2; c.fill(); if (edge !== false) { c.strokeStyle = GFX.line; c.lineWidth = 1.5; c.stroke(); } c.strokeStyle = rgba('#FFFFFF', 0.35); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.08); c.lineTo(x + lean * 0.85 - w * 0.03, y - h * 0.85); c.stroke(); }
    /* a crystal: a pointed hexagon, a bright facet down one side */
    function crystal(c, x, y, w, h, rot, fill, lit) { c.save(); c.translate(x, y); c.rotate(rot || 0); const hex = [[0, -h / 2], [w / 2, -h / 4], [w / 2, h / 4], [0, h / 2], [-w / 2, h / 4], [-w / 2, -h / 4]]; glass(c, hex, fill, 0.9, { lit: lit || '#FFFFFF', lw: 1.5, edge: GFX.line }); poly(c, [[0, -h / 2], [-w / 2, -h / 4], [-w / 2, h / 4], [0, h / 2]]); c.fillStyle = rgba(lit || '#FFFFFF', 0.28); c.fill(); poly(c, [[0, -h / 2], [w / 2, -h / 4], [0, h / 4 * 0.2]]); c.fillStyle = rgba(mix(fill, '#000000', 0.4), 0.35); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(fill), -w, -h * 0.75, w * 2, h * 1.5); c.restore(); c.restore(); }
    /* a ribbon: a thick polyline with a bright core, widths tapering by the taper function (0..1 along) */
    function ribbon(c, pts, w, col, core, taper) { if (pts.length < 2) return; c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1), k = taper ? taper(u) : 1; c.strokeStyle = col; c.lineWidth = Math.max(0.5, w * k); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); if (core) { c.strokeStyle = core; c.lineWidth = Math.max(0.5, w * k * 0.35); c.stroke(); } } }
    function arcRibbon(c, x, y, r, a0, a1, w, col, core, ry) { c.save(); c.translate(x, y); c.scale(1, ry == null ? 1 : ry); c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, a0, a1); c.stroke(); if (core) { c.strokeStyle = core; c.lineWidth = w * 0.35; c.stroke(); } c.restore(); }
    /* a soft glow sprite, additive */
    function glow(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a == null ? 0.6 : a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
    function ray(c, x, y, a, len, w, col, alpha) { c.save(); c.translate(x, y); c.rotate(a); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha == null ? 0.8 : alpha; blitSized(c, beamSprite(col), -w * 0.4, -w * 1.6, len + w, w * 3.2); c.restore(); }
    /* a shadow on the floor under something that floats */
    function shadow(c, x, y, r, a) { c.fillStyle = `rgba(0,0,0,${a == null ? 0.22 : a})`; floorEllipse(c, x, y, r); c.fill(); }
    /* --- shading: the light comes from the upper left, a little in front. Solid things get a lit side, a core shade
       and a dark side with a rim of reflected light; glassy things a translucent body, a bright top highlight band and
       a specular point; glowing things an additive core. Gradients are made per draw (cheap at these sizes), but keep
       them to the hero shapes, not to every particle --- */
    const LX = -0.6, LY = -0.8;   // the light direction on screen (unit-ish)
    function mix(h1, h2, k) { const a = hexRGB(h1), b = hexRGB(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`; }
    /* a lit sphere: radial gradient off-centre toward the light, a specular dot, a rim of reflected light low right */
    function sphere(c, x, y, r, col, lit, dark, o) { o = o || {}; const g2 = c.createRadialGradient(x + LX * r * 0.45, y + LY * r * 0.45, r * 0.05, x, y, r); g2.addColorStop(0, lit || '#FFFFFF'); g2.addColorStop(0.35, col); g2.addColorStop(0.85, dark || mix(col, '#000000', 0.45)); g2.addColorStop(1, dark || mix(col, '#000000', 0.6)); c.fillStyle = g2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (o.rim !== false) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.strokeStyle = rgba(o.rimCol || lit || '#FFFFFF', 0.35); c.lineWidth = r * 0.18; c.beginPath(); c.arc(x - LX * r * 0.15, y - LY * r * 0.15, r * 0.92, 0.3, 1.9); c.stroke(); c.restore(); } if (o.outline !== false) { c.strokeStyle = GFX.line; c.lineWidth = o.lw || 1.5; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); } if (o.spec !== false) { c.fillStyle = rgba('#FFFFFF', 0.85); c.beginPath(); c.ellipse(x + LX * r * 0.5, y + LY * r * 0.5, r * 0.2, r * 0.13, -0.6, 0, TAU); c.fill(); } }
    /* a lit polygon (a slab, a plate, a facet): a linear gradient from its lit corner to its dark one, an inner bevel line on the lit edges */
    function slab(c, pts, col, lit, dark, o) { o = o || {}; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } const g2 = c.createLinearGradient(x0, y0, x1, y1); g2.addColorStop(0, lit || mix(col, '#FFFFFF', 0.4)); g2.addColorStop(0.45, col); g2.addColorStop(1, dark || mix(col, '#000000', 0.5)); poly(c, pts); c.fillStyle = g2; c.fill(); if (o.outline !== false) { c.strokeStyle = GFX.line; c.lineWidth = o.lw || 1.5; c.stroke(); } if (o.bevel !== false) { c.save(); poly(c, pts); c.clip(); c.strokeStyle = rgba(lit || '#FFFFFF', 0.45); c.lineWidth = 3; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke(); c.restore(); } }
    /* a glassy, translucent shape (ice, amber, water, light): a tinted body, a bright highlight band near its top, a dark edge, a specular point */
    function glass(c, pts, tint, alpha, o) { o = o || {}; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } poly(c, pts); const g2 = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.3, y1); g2.addColorStop(0, rgba(o.lit || '#FFFFFF', alpha * 0.9)); g2.addColorStop(0.25, rgba(tint, alpha * 0.55)); g2.addColorStop(0.7, rgba(tint, alpha * 0.75)); g2.addColorStop(1, rgba(o.dark || mix(tint, '#000000', 0.5), alpha * 0.9)); c.fillStyle = g2; c.fill(); c.save(); poly(c, pts); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba('#FFFFFF', 0.55 * alpha); c.lineWidth = Math.max(2, (y1 - y0) * 0.08); c.beginPath(); c.moveTo(x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * 0.18); c.lineTo(x0 + (x1 - x0) * 0.6, y0 + (y1 - y0) * 0.1); c.stroke(); c.restore(); poly(c, pts); c.strokeStyle = o.edge || rgba(mix(tint, '#000000', 0.55), 0.9); c.lineWidth = o.lw || 1.5; c.stroke(); if (o.spec !== false) { c.fillStyle = rgba('#FFFFFF', 0.9 * alpha); c.beginPath(); c.arc(x0 + (x1 - x0) * 0.28, y0 + (y1 - y0) * 0.22, Math.max(1.2, (x1 - x0) * 0.05), 0, TAU); c.fill(); } }
    /* a blurred motion trail: the path drawn thick and faint to thin and bright, head last */
    function trail(c, pts, w, col, core) { if (pts.length < 2) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1); c.globalAlpha = 0.12 + 0.5 * u; c.strokeStyle = col; c.lineWidth = w * (0.35 + 0.65 * u); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } if (core) { c.globalAlpha = 0.9; c.strokeStyle = core; c.lineWidth = w * 0.3; c.beginPath(); c.moveTo(pts[Math.max(0, pts.length - 4)][0], pts[Math.max(0, pts.length - 4)][1]); for (let i = Math.max(1, pts.length - 3); i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } c.restore(); }
    /* a glowing energy core: layered additive discs, hot white centre, the element round it, a soft halo */
    function core(c, x, y, r, col, hot, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (a == null ? 1 : a) * 0.55; blitSized(c, glowSprite(col), x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); c.globalAlpha = (a == null ? 1 : a); const g2 = c.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, hot || '#FFFFFF'); g2.addColorStop(0.4, hot || '#FFFFFF'); g2.addColorStop(0.75, col); g2.addColorStop(1, rgba(col, 0)); c.fillStyle = g2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
    /* a soft contact shadow with a darker centre */
    function softShadow(c, x, y, r, a) { const g2 = c.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, `rgba(0,0,0,${a == null ? 0.3 : a})`); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; floorEllipse(c, x, y, r); c.fill(); }
    const ease = { out: u => 1 - (1 - u) * (1 - u), in: u => u * u, io: u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2), back: u => { const s = 1.7; u -= 1; return u * u * ((s + 1) * u + s) + 1; }, pop: u => Math.sin(u * Math.PI) };
    const clamp01 = u => Math.max(0, Math.min(1, u));
    /* the fade of a thing that appears, lasts and leaves: 0..1 over life, in `a` seconds, out over `b` */
    const fade = (f, a, b) => Math.min(1, f.t / a, f.life / b);
    const H = { X, me, g, mons, fx, add, living, near, sortNear, sp, rgba, angTo, wrap, walk, Q, n, hitArea, hitLine, hitCone, hitRing, pull, push, slow, lift, bind, warn, warnLine, warnCone, fire, P, burst, glowAt, flareAt,
      GY, floorEllipse, poly, block, spike, crystal, ribbon, arcRibbon, glow, ray, shadow, LX, LY, mix, sphere, slab, glass, trail, core, softShadow, ease, clamp01, fade, TAU, sx: X.sx, sy: X.sy, line: () => GFX.line };
    function run(kind, key, C) {
      const I = ELEM_IMPL[C.e8] && ELEM_IMPL[C.e8][kind] && ELEM_IMPL[C.e8][kind][key];
      if (!I) { X.text(me.x, me.y - 1.2, 'This move is still being forged', '#CFE2FF', 12); return false; }
      const E = ELEMENTS[C.el] || E8[C.e8], col = E.color, core = E.core || '#FFFFFF';
      I(Object.assign({ col, core, dark: E.dark, K: C.up ? 1.25 : 1, evo: C.evo || 1, dmgO: extra => Object.assign({ el: C.el, src: kind }, extra || {}) }, C), H);
      return true;
    }
    const strong = (key, C) => run('strong', key, C), ult = (key, C) => run('ult', key, C);
    function update(dt) { for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; f.life -= dt; if (f.update) f.update(dt, f); if (f.life <= 0) { if (f.onEnd) f.onEnd(f); fx.splice(i, 1); } } }
    function draw(c, under) { const T = X.Tz(), t = g.t; for (const f of fx) { const fn = under ? f.drawUnder : f.draw; if (!fn) continue; c.save(); fn.call(f, c, f, f.x != null ? X.sx(f.x) : X.sx(me.x), f.y != null ? X.sy(f.y) : X.sy(me.y), T, t); c.restore(); } }
    return { fx, strong, ult, update, draw, H };
  }
  return { create };
})();
