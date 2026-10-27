const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 82, seals: ['belfry','garden','dunes','sepulchre','aurora','yuggoth','library'] }); const { page, start, run } = T;
  await start('moon', 6); await run(2); console.log(await page.evaluate(() => JSON.stringify(window.__palDbg))); process.exit(0); })();
