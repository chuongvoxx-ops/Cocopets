// Beast Machine (Thunder's 11th Ultimate, 20k9i / 20k9j / 20k9k): today's gameplay pinned before its GPU remake (tests/lib/vehpin.js).
// usage: HTML=test-xyz.html EVO=1|4|7 node tests/beast.js        UPDATE=1 rewrites tests/baseline/beastmachine-evoN.json
require('./lib/vehpin')({ key: 'beastmachine', el: 'thunder', g: '_beast', body: 'beast', ready: 'ride', busyKeys: ['drift', 'jump'], fin: 'Judgement Day', finDist: 3, finExact: 1,
  dur: [20, 25, 35], tunes: [['strongs', 'BEAST_MOVES.TUNE_S'], ['judgement', 'BEAST_MOVES.TUNE_J']],
  labels: [/MISSILE/, /WRATH/, /DRIFT/, /JUDGEMENT/],
  moves: [{ btn: 'dodge', name: 'Drift', stat: 'drift', dist: 1.6, wait: 4 }, { btn: 'jump', name: 'Jump', stat: 'jump', dist: 4.2, wait: 4, win: 1.3 }, { btn: 'strong', name: 'Homing Missiles', stat: 'missiles', dist: 4, wait: 6 }, { btn: 'strong2', name: "Heaven's Wrath", stat: 'wrath', dist: 3.5, wait: 7 }],
  smash: [['dodge', 2.3], ['jump', 3.6]], names: { dodge: 'Drift', jump: 'Jump' } });
