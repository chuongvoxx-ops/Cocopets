const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 40, seals: ['belfry'] }); const { page, errors } = T;
  await page.evaluate(() => { const P = window.__pp; P.startRift('garden', 0); }); await page.waitForTimeout(6000);
  console.log(await page.evaluate(() => window.__pp.arc.state), errors.slice(0, 5)); process.exit(0); })();
