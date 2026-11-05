/* ---------- Cocopets Town: the layout every hub file shares ----------
   World units are pixels, y down, y is depth (an entity's baseline is its feet). Elevation: level 0 is the valley floor
   (plaza, market, workshop, riverbanks), level 1 the cottage terrace and the dojo courtyard, level 2 the sanctuary and
   the lookout. A terrace is walled all round except where a ramp (or stairs) lets you walk up to it.
   Walking speed is 230 px/s (2.3x dashing), so neighbouring facilities are 10–20 s apart. Everything here is data; the
   core (24a) moves and draws, the art kits (24b, 24c) paint, the facilities file (24d) makes places do things. */
const HUB = {
  W: 2600, H: 2000,
  spawn: { x: 1300, y: 1120 },                    // the arrival point on the plaza's south edge
  // ---- districts: centre, radius of the area, elevation level, the facilities file hangs interactions on these ids
  districts: {
    plaza:      { x: 1300, y: 980,  r: 230, lv: 0, name: 'Blossom Plaza' },
    cottage:    { x: 720,  y: 520,  r: 260, lv: 1, name: 'Home' },
    farm:       { x: 470,  y: 1240, r: 300, lv: 0, name: 'Sunberry Farm' },
    dojo:       { x: 2020, y: 900,  r: 280, lv: 1, name: 'Training Grounds' },
    sanctuary:  { x: 1300, y: 330,  r: 240, lv: 2, name: 'Elemental Sanctuary' },
    market:     { x: 1300, y: 1450, r: 240, lv: 0, name: 'Market & Kitchen' },
    workshop:   { x: 1960, y: 1450, r: 190, lv: 0, name: 'Workshop' },
    riverside:  { x: 1250, y: 1830, r: 300, lv: 0, name: 'Riverside Garden' },
    lookout:    { x: 2330, y: 280,  r: 150, lv: 2, name: 'Lookout' },
    hideaway:   { x: 330,  y: 820,  r: 120, lv: 0, name: 'Hidden Garden' },
  },
  // ---- terraces: polygons (world px) at a level, each with the ramps that climb onto it (a ramp is a rect you can walk through)
  terraces: [
    { id: 'cottage', lv: 1, poly: [[380, 250], [1060, 250], [1100, 700], [1000, 760], [400, 780]], ramps: [{ x: 880, y: 740, w: 140, h: 90, dir: 's' }, { x: 1040, y: 420, w: 110, h: 120, dir: 'e' }] },
    { id: 'dojo', lv: 1, poly: [[1720, 620], [2400, 600], [2420, 1180], [1760, 1200]], ramps: [{ x: 1700, y: 880, w: 110, h: 150, dir: 'w' }, { x: 2000, y: 1180, w: 150, h: 90, dir: 's' }, { x: 2380, y: 940, w: 110, h: 120, dir: 'e' }] },
    { id: 'sanctuary', lv: 2, poly: [[1160, 120], [1560, 120], [1600, 540], [1120, 540]], ramps: [{ x: 1230, y: 520, w: 140, h: 110, dir: 's' }] },
    { id: 'lookout', lv: 2, poly: [[2180, 120], [2500, 140], [2520, 440], [2200, 460]], ramps: [{ x: 2160, y: 300, w: 110, h: 120, dir: 'w' }] },
  ],
  // ---- paths: polylines with a width; patterned paving on the plaza, flagstones elsewhere, dirt on the farm
  paths: [
    { pts: [[1300, 1120], [1300, 1300], [1300, 1420]], w: 90, kind: 'flag' },           // plaza → market
    { pts: [[1300, 1500], [1300, 1640], [1280, 1760]], w: 70, kind: 'flag' },           // market → river bridge → garden
    { pts: [[1180, 1000], [980, 1000], [900, 880], [900, 790]], w: 80, kind: 'flag' },   // plaza → cottage ramp
    { pts: [[1300, 760], [1300, 640]], w: 90, kind: 'flag' },                           // plaza → sanctuary stairs
    { pts: [[1420, 1000], [1600, 1000], [1700, 960]], w: 80, kind: 'flag' },            // plaza → dojo ramp
    { pts: [[1180, 1060], [900, 1160], [720, 1220]], w: 70, kind: 'dirt' },             // plaza → farm
    { pts: [[1420, 1480], [1700, 1470], [1860, 1460]], w: 70, kind: 'flag' },           // market → workshop
    { pts: [[2060, 1270], [2000, 1360], [1960, 1400]], w: 60, kind: 'flag' },           // dojo ramp → workshop
    { pts: [[2240, 1000], [2520, 1000]], w: 80, kind: 'flag' },                         // dojo → the Tower gate (east)
    { pts: [[2130, 360], [2000, 420], [1620, 460]], w: 60, kind: 'dirt' },              // lookout → sanctuary (upper trail)
    { pts: [[700, 1240], [520, 1000], [420, 880]], w: 50, kind: 'dirt' },               // farm → hidden garden
    { pts: [[1250, 1780], [1000, 1840], [760, 1800]], w: 60, kind: 'dirt' },            // garden → west riverbank
    { pts: [[1300, 1780], [1560, 1860], [1800, 1840]], w: 60, kind: 'dirt' },           // garden → east riverbank
  ],
  // ---- the river (a polyline with a width) and its bridges (rects you can walk over; the water under them is not blocking)
  river: { pts: [[0, 1600], [300, 1640], [620, 1700], [900, 1690], [1150, 1660], [1400, 1680], [1700, 1720], [2000, 1760], [2300, 1740], [2600, 1700]], w: 96 },
  bridges: [{ x: 1250, y: 1620, w: 110, h: 130, dir: 'ns' }, { x: 760, y: 1640, w: 100, h: 120, dir: 'ns' }, { x: 2010, y: 1700, w: 100, h: 130, dir: 'ns' }],
  dock: { x: 1180, y: 1760, w: 120, h: 50 },         // the wooden dock reaching into the river from the south bank
  // ---- buildings: the art kit draws each kind; w/d are the footprint (world px) whose baseline is y; door is where you enter
  buildings: [
    { id: 'cottage',   kind: 'cottage',   x: 720,  y: 520,  w: 300, d: 170, door: [720, 540], face: 's' },
    { id: 'shed',      kind: 'shed',      x: 300,  y: 1130, w: 120, d: 80,  door: [300, 1140], face: 's' },
    { id: 'dojo',      kind: 'dojo',      x: 2080, y: 800,  w: 320, d: 190, door: [2080, 820], face: 's' },
    { id: 'shrineL',   kind: 'shrine',    x: 1140, y: 280,  w: 110, d: 80,  face: 's' },
    { id: 'shrineR',   kind: 'shrine',    x: 1460, y: 280,  w: 110, d: 80,  face: 's' },
    { id: 'altar',     kind: 'altar',     x: 1300, y: 230,  w: 160, d: 100, door: [1300, 260], face: 's' },
    { id: 'kitchen',   kind: 'kitchen',   x: 1500, y: 1400, w: 200, d: 130, door: [1500, 1420], face: 's' },
    { id: 'stallA',    kind: 'stall',     x: 1130, y: 1380, w: 130, d: 80,  door: [1130, 1400], face: 's', color: '#E84C6A' },
    { id: 'stallB',    kind: 'stall',     x: 1130, y: 1520, w: 130, d: 80,  door: [1130, 1540], face: 'n', color: '#4F9FE0' },
    { id: 'stallC',    kind: 'stall',     x: 1340, y: 1540, w: 130, d: 80,  door: [1340, 1560], face: 'n', color: '#F2B13C' },
    { id: 'stallD',    kind: 'stall',     x: 1280, y: 1330, w: 130, d: 80,  door: [1280, 1350], face: 's', color: '#7FC46E' },
    { id: 'workshop',  kind: 'workshop',  x: 1960, y: 1400, w: 240, d: 150, door: [1960, 1420], face: 's' },
    { id: 'gate',      kind: 'gate',      x: 2560, y: 1000, w: 70,  d: 140, door: [2540, 1000], face: 'w' },     // the Tower of Oblivion
    { id: 'riftgate',  kind: 'riftgate',  x: 2460, y: 230,  w: 90,  d: 90,  door: [2440, 240], face: 'w' },      // the Rifts
    // the six mini-game houses (keys as the arcade knows them), round the outskirts
    { id: 'flappy',    kind: 'hangar',    x: 540,  y: 1560, w: 200, d: 130, door: [540, 1580], face: 's', game: 'flappy' },
    { id: 'maze',      kind: 'hedge',     x: 1700, y: 300,  w: 200, d: 140, door: [1700, 320], face: 's', game: 'maze' },
    { id: 'shooter',   kind: 'dome',      x: 860,  y: 300,  w: 180, d: 140, door: [860, 320], face: 's', game: 'shooter' },
    { id: 'blocks',    kind: 'mine',      x: 2340, y: 1420, w: 190, d: 130, door: [2340, 1440], face: 's', game: 'blocks' },
    { id: 'sling',     kind: 'tent',      x: 2160, y: 1880, w: 190, d: 110, door: [2160, 1900], face: 's', game: 'sling' },
    { id: 'platform',  kind: 'gym',       x: 640,  y: 1880, w: 200, d: 120, door: [640, 1900], face: 's', game: 'platform' },
  ],
  // ---- landmarks and large props (the art kit draws these kinds too)
  props: [
    { kind: 'bigtree',  x: 1300, y: 900 },  { kind: 'fountain', x: 1300, y: 1040 },
    { kind: 'bench', x: 1180, y: 1060, face: 'e' }, { kind: 'bench', x: 1420, y: 1060, face: 'w' }, { kind: 'bench', x: 1250, y: 1900, face: 'n' },
    { kind: 'lanternpost', x: 1160, y: 920 }, { kind: 'lanternpost', x: 1440, y: 920 }, { kind: 'lanternpost', x: 1160, y: 1110 }, { kind: 'lanternpost', x: 1440, y: 1110 },
    { kind: 'well', x: 560, y: 700 }, { kind: 'woodpile', x: 880, y: 600 }, { kind: 'flowerbed', x: 600, y: 600 }, { kind: 'flowerbed', x: 840, y: 680 },
    { kind: 'trellis', x: 640, y: 1130 }, { kind: 'trellis', x: 640, y: 1330 }, { kind: 'cart', x: 380, y: 1380 }, { kind: 'scarecrow', x: 480, y: 1050 },
    { kind: 'dummy', x: 1980, y: 1040 }, { kind: 'dummy', x: 2100, y: 1060 }, { kind: 'dummy', x: 2220, y: 1040 }, { kind: 'banner', x: 1900, y: 780 }, { kind: 'banner', x: 2260, y: 780 }, { kind: 'rack', x: 2300, y: 940 },
    { kind: 'crystal', x: 1200, y: 420 }, { kind: 'crystal', x: 1400, y: 420 }, { kind: 'pool', x: 1300, y: 440 }, { kind: 'torii', x: 1300, y: 600 },
    { kind: 'cookpot', x: 1420, y: 1460 }, { kind: 'crates', x: 1620, y: 1480 }, { kind: 'baskets', x: 1200, y: 1460 },
    { kind: 'workbench', x: 1840, y: 1500 }, { kind: 'anvil', x: 2060, y: 1500 }, { kind: 'lumber', x: 1880, y: 1340 },
    { kind: 'picnic', x: 1380, y: 1880 }, { kind: 'reeds', x: 1050, y: 1720 }, { kind: 'reeds', x: 1550, y: 1730 }, { kind: 'reeds', x: 1950, y: 1800 }, { kind: 'rocks', x: 800, y: 1760 },
    // ---- fantasy sculptures and props (round 1b): abstract 3D monuments, floating crystals, glowing growths
    { kind: 'sculpture', v: 'spiral', x: 1120, y: 1130 }, { kind: 'sculpture', v: 'heart', x: 1480, y: 1130 }, { kind: 'sculpture', v: 'moonarch', x: 2330, y: 200 },
    { kind: 'sculpture', v: 'orbit', x: 1300, y: 160 }, { kind: 'sculpture', v: 'wave', x: 1120, y: 1900 }, { kind: 'sculpture', v: 'twist', x: 1800, y: 1560 },
    { kind: 'floatcrystal', x: 1100, y: 340 }, { kind: 'floatcrystal', x: 1500, y: 340 }, { kind: 'floatcrystal', x: 1300, y: 520 }, { kind: 'floatcrystal', x: 2460, y: 320 },
    { kind: 'runestone', x: 1060, y: 470 }, { kind: 'runestone', x: 1540, y: 470 }, { kind: 'runestone', x: 2200, y: 400 }, { kind: 'runestone', x: 420, y: 760 },
    { kind: 'glowshrooms', x: 280, y: 880 }, { kind: 'glowshrooms', x: 380, y: 880 }, { kind: 'glowshrooms', x: 1240, y: 850 }, { kind: 'glowshrooms', x: 900, y: 1740 }, { kind: 'glowshrooms', x: 1860, y: 1790 },
    { kind: 'windchime', x: 640, y: 480 }, { kind: 'windchime', x: 1560, y: 1380 }, { kind: 'windchime', x: 1700, y: 1830 },
    { kind: 'fairylights', x: 1300, y: 1000 }, { kind: 'fairylights', x: 1300, y: 1450 }, { kind: 'fairylights', x: 1250, y: 1860 },
    { kind: 'wishingstar', x: 2260, y: 230 }, { kind: 'lilypads', x: 1600, y: 1700 }, { kind: 'lilypads', x: 500, y: 1680 }, { kind: 'stonelantern', x: 1180, y: 600 }, { kind: 'stonelantern', x: 1420, y: 600 },
    { kind: 'telescope', x: 2340, y: 260 }, { kind: 'bench', x: 2300, y: 330, face: 's' }, { kind: 'flowerring', x: 330, y: 820 }, { kind: 'readingbench', x: 1700, y: 1850 },
  ],
  // ---- the farm plots (world px, each plot 90 x 70 on terraced beds); the greenhouse site is kept free for an upgrade
  plots: [[420, 1190], [530, 1190], [640, 1190], [420, 1290], [530, 1290], [640, 1290]],
  greenhouseSite: { x: 480, y: 1420, w: 220, d: 120 },
  orchard: [[300, 1000], [360, 960], [230, 1080], [760, 1080], [820, 1140], [240, 1260], [240, 1360], [780, 1400]],
  // ---- trees, shrubs and rocks the landscape painter places (x, y, kind, size); the core turns them into blockers/depth entities
  trees: [
    [1100, 160, 'pine', 1.1], [1560, 170, 'pine', 1.0], [1000, 580, 'oak', 1.0], [440, 300, 'oak', 1.2], [560, 280, 'cherry', 1.0], [980, 280, 'cherry', 0.9],
    [1660, 560, 'oak', 1.1], [1960, 560, 'pine', 1.0], [2260, 560, 'pine', 1.1], [2460, 700, 'oak', 1.0], [2480, 1240, 'oak', 1.0], [1760, 1260, 'cherry', 0.9],
    [1060, 1220, 'cherry', 1.0], [1560, 1220, 'cherry', 1.0], [1700, 1600, 'oak', 1.0], [2200, 1580, 'oak', 1.1], [880, 1520, 'oak', 1.0], [400, 1520, 'willow', 1.1],
    [1000, 1900, 'willow', 1.1], [1500, 1940, 'willow', 1.0], [1900, 1920, 'willow', 1.0], [2400, 1860, 'oak', 1.0], [160, 1480, 'pine', 1.0], [160, 600, 'pine', 1.1],
    [2540, 420, 'pine', 1.0], [2140, 180, 'pine', 0.9], [1820, 160, 'cherry', 1.0], [2000, 1960, 'cherry', 0.9],
  ],
  shrubs: [[1200, 860, 1], [1400, 860, 1], [620, 740, 0.8], [820, 760, 0.8], [1140, 540, 0.9], [1460, 540, 0.9], [1840, 640, 0.9], [2320, 640, 0.9], [1120, 1600, 0.8], [1480, 1600, 0.8], [1880, 1560, 0.8], [2040, 1560, 0.8], [900, 1200, 0.8], [2440, 880, 0.9], [2440, 1120, 0.9]],
  rocks: [[1700, 1140, 1], [360, 700, 0.8], [2360, 220, 1.2], [2500, 360, 0.9], [700, 1660, 0.8], [1820, 1740, 0.9], [1620, 1800, 0.7]],
  // ---- scenic spots (small interactions the facilities file can hang on): x, y, what
  spots: [{ id: 'lookout', x: 2330, y: 280 }, { id: 'hidden', x: 330, y: 820 }, { id: 'reading', x: 1700, y: 1850 }, { id: 'hideaway', x: 1260, y: 850 }, { id: 'dockend', x: 1180, y: 1790 }],
  // ---- where things come and go
  gates: { tower: 'gate', rift: 'riftgate' },
};
