const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 82, seals: ['belfry','garden','dunes','sepulchre','aurora','yuggoth','library'] }); const { page, errors } = T; page.on('console', m => console.log('CON', m.text().slice(0, 400)));
  const st = process.argv[2] === 'gate' ? 'gate' : Number(process.argv[2]);
  await page.evaluate(([id, stage]) => { const P = window.__pp; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); try { if (stage === 'gate') P.startGate(id); else P.startRift(id, stage); } catch (e) { window.__e = e.message + ' ' + e.stack; } }, ['moon', st]);
  await page.waitForTimeout(4000); console.log(await page.evaluate(() => [window.__pp.arc.state, window.__e])); console.log(errors.slice(0, 5)); process.exit(0); })();
