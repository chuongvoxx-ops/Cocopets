// the move stick must never stay held once the finger is gone: a pointer whose up never reached the canvas is released
// by a page-level up, by "no touches left", by the page hiding, or taken over by the next thumb in the stick zone
const L = require('./_rift-lib.js');
(async () => { const T = await L.open({ lvl: 12 }); const { page, start, run, errors } = T; let fails = 0;
  const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
  await start('belfry', 0); await run(3);
  const D = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { held: D.stick.id != null, ptrs: window.__pp.arc.ptr.size, x: D.me.x }; });
  // the stick held by a synthetic pointer, then its up lost (never dispatched)
  const hold = (id) => page.evaluate(id => { const cv = document.getElementById('arcCanvas'), r = cv.getBoundingClientRect(), x = r.left + 80, y = r.top + r.height * 0.8; const ev = t => new PointerEvent(t, { pointerId: id, pointerType: 'touch', isPrimary: true, clientX: x - (t === 'pointerdown' ? 0 : 60), clientY: y, bubbles: true, cancelable: true, buttons: 1 }); cv.dispatchEvent(ev('pointerdown')); cv.dispatchEvent(ev('pointermove')); }, id);
  await hold(7); await run(0.6); let r = await D(); const x0 = r.x; await run(0.6); let r2 = await D();
  ok(r.held && r.ptrs === 1 && r2.x < x0 - 0.5, 'a held stick moves the pet left');
  // 1. a page-level pointerup (the canvas never saw it) releases it
  await page.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true, clientX: 10, clientY: 10 }))); r = await D(); ok(!r.held && r.ptrs === 0, 'a pointerup anywhere on the page releases the stick');
  // 2. no touches left on the screen releases everything
  await hold(8); r = await D(); ok(r.held, 'held again'); await page.evaluate(() => document.body.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [] }))); r = await D(); ok(!r.held && r.ptrs === 0, 'a touchend with no touches left releases the stick');
  // 3. the page going hidden releases it
  await hold(9); r = await D(); ok(r.held, 'held again'); await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); }); r = await D(); ok(!r.held && r.ptrs === 0, 'the page hiding releases the stick');
  await page.evaluate(() => { const P = window.__pp; if (P.arc.paused) P.togglePause(); });
  // 4. with no release at all, a new thumb in the stick zone takes the stick over
  await hold(10); r = await D(); ok(r.held, 'held again'); await page.evaluate(() => { const cv = document.getElementById('arcCanvas'), r = cv.getBoundingClientRect(), x = r.left + 60, y = r.top + r.height * 0.75; const ev = t => new PointerEvent(t, { pointerId: 11, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1 }); cv.dispatchEvent(ev('pointerdown')); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 11, pointerType: 'touch', clientX: x, clientY: y, bubbles: true })); });
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { held: D.stick.id != null, id: D.stick.id }; }); ok(!r.held, 'a new thumb in the stick zone takes the stick, and its up frees it');
  // 5. a mouse moving with no button held releases
  await hold(12); await page.evaluate(() => { const cv = document.getElementById('arcCanvas'); cv.dispatchEvent(new PointerEvent('pointermove', { pointerId: 12, pointerType: 'mouse', clientX: 50, clientY: 50, bubbles: true, buttons: 0 })); }); r = await D(); ok(!r.held, 'a mouse pointer moving with no button down is released');
  console.log('errors', errors.length, JSON.stringify(errors)); ok(errors.length === 0, 'no page errors'); console.log(fails ? `${fails} FAILED` : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0); })();
