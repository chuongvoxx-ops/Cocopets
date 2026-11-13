// Nidhogg (Fire's 11th Ultimate, 20k6g / 20k6h / 20k6i): today's gameplay pinned before its GPU remake (tests/lib/vehpin.js).
// Ultima's own detail stays in tests/nidhogg-ultima.js.
// usage: HTML=test-xyz.html EVO=1|4|7 node tests/nidhogg.js      UPDATE=1 rewrites tests/baseline/nidhogg-evoN.json
require('./lib/vehpin')({ key: 'nidhogg', el: 'fire', g: '_nidhogg', body: 'dragon', ready: 'fly', busyKeys: ['dive'], fin: 'Ultima', finDist: 4, finExact: 1,
  dur: [20, 25, 35], tunes: [['moves', 'NIDHOGG_MOVES.TUNE_S'], ['ultima', 'NIDHOGG_MOVES.TUNE_U']],
  labels: [/DIVE/, /FIREBALL/, /FLARE/, /ULTIMA/],
  moves: [{ btn: 'dodge', name: 'Dive Bomb', stat: 'dives', dist: 4, wait: 4 }, { btn: 'strong', name: 'Fireballs', stat: 'fireballs', dist: 4.5, wait: 4 }, { btn: 'strong2', name: 'Flare', stat: 'flare', dist: 4.5, wait: 8 }],
  smash: [['dodge', 3.5]], names: { dodge: 'Dive Bomb' } });
