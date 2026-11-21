// v445 AG: "before" shots of the old Amber Vigil (a build of the last release: BEFORE=<its test build>) for the before/after sheet
// BEFORE=<html> node tests/_sg-before.js   (DPR=3)
const { open } = require('./_sg-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => {
  const T = await open({ dpr: DPR, html: process.env.BEFORE }); const { M, run, goTo } = T;
  await T.start(); await run(2.5); await T.shot('v445-AG', `before-vigil-${tag}`);
  await goTo(12.5, 6.5); await run(1.5); await T.shot('v445-AG', `before-vigil2-${tag}`);
  console.log(T.errors.length ? 'errors ' + T.errors.slice(0, 2).join(' | ') : 'ok'); await T.browser.close();
})();
