const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors } = T; const cons = []; page.on('console', m => { if (m.type() === 'error') cons.push(m.text()); }); process.on('exit', () => console.log('console:', cons.slice(0, 3).join(' || ')));
  const st = +process.argv[2];
  await page.evaluate(st => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); try { P.startRift('sepulchre', st); } catch (e) { window.__err = e.stack; } }, st).catch(e => console.log('E', e.message));
  await page.waitForTimeout(3000); console.log(await page.evaluate(() => [window.__err || '', window.__pp.arc.state, window.__pp.arc.open, document.querySelector('.toast') && document.querySelector('.toast').textContent]), errors.slice(0, 3)); process.exit(0); })();
