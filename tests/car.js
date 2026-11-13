// Sports Car (Light's 11th Ultimate, 20k4p / 20k4q): today's gameplay pinned before its GPU remake (tests/lib/vehpin.js).
// usage: HTML=test-xyz.html EVO=1|4|7 node tests/car.js          UPDATE=1 rewrites tests/baseline/sportscar-evoN.json
require('./lib/vehpin')({ key: 'sportscar', el: 'light', g: '_sportscar', body: 'car', ready: 'drive', busyKeys: ['drift', 'jump'], fin: 'Supernova', finDist: 3, finSoft: 1 /* (the car drives through its pulses, which scale with range: the per-hit set varies; its numbers are pinned through TUNE) */,
  dur: [20, 25, 35], tunes: [['moves', 'SPORTSCAR_MOVES.TUNE']],
  labels: [/SHOOTING STAR|STAR/, /LOVE/, /DRIFT/, /SUPERNOVA/],
  moves: [{ btn: 'dodge', name: 'Drift', stat: 'obj:drift', dist: 1.6, wait: 4 }, { btn: 'jump', name: 'Jump', stat: 'jump', dist: 3.2, wait: 4 }, { btn: 'strong', name: 'Shooting Star', stat: 'star', dist: 3.5, wait: 6 }, { btn: 'strong2', name: 'Love Sensation', stat: 'love', dist: 3.5, wait: 7 }],
  smash: [['dodge', 2.3], ['jump', 3.2]], names: { dodge: 'Drift', jump: 'Jump' } });
