// quick look at the Amber Vigil's start: node tests/_vigil-shot.js (SHOTS=1)
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 32, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, shot, start, run } = T;
  await start('dunes', 'gate'); await run(4.5); await shot('vigil-start');
  console.log('errors', errors.length, errors.slice(0, 3)); process.exit(0);
})();
