// Fire Flan, every pose and state photographed in the game (GPU model under swiftshader, high quality):
// idle, slam wind-up, spit, breaker wind-up with its interrupt point, a cold field running, chilled, brittle, phase 2
// (lobes, cinderlings, sweep), phase 3 (tall, steam, burst, rush), the death. Pictures: shots/calF/pose-*.png
// HTML=test-calF.html node tests/_cal-f-shots.js   env: ONLY=name,name (a subset), ZOOM=1.5 (closer), GL=0 (the 2D picture)
process.env.HTML = process.env.HTML || 'test-calF.html';
const L = require('./_cal-f-lib');
const only = process.env.ONLY ? process.env.ONLY.split(',') : null, want = n => !only || only.some(o => n.includes(o));
(async () => {
  const T = await L.open({ shots: true, god: true, hq: true, gl: process.env.GL !== '0', dpr: +(process.env.DPR || 2) });
  const { page, errors, shot, ev } = T;
  await T.startFlan(); await T.wake();
  const Z = +(process.env.ZOOM || 1.45);
  await ev(`D.g.zoomP = arg; D.g.zoomT = 1e9; D.g.taps = 99; D.banners.length = 0; window.__calDbg = window.__pp.FIEND_DEFS.calflan.dbgStart;`, Z);
  // freeze the pet near the flan, out of harm, and keep the flan's health where a phase wants it
  const pose = (name, body, secs) => ev(`const keep = arg[1]; ${body}; S(arg[0], t => { me.hp = D.ST.hp; me.mp = 999; D.banners.length = 0; if (window.__keep) window.__keep(t); }); await frame(); await frame(); return { act: b.act, chill: +M.chill.toFixed(2), brittle: M.brittle, phase: FX.S.phase };`, [secs || 0.6, 0]);
  const snap = async (name, body, secs) => { if (!want(name)) return; const r = await pose(name, body, secs); console.log(name, JSON.stringify(r)); await shot('pose-' + name); };
  const near = `window.__keep = () => { hold(b.x + 1.5, b.y + 4.2); b.x = window.__bx; b.y = window.__by; }; window.__bx = b.x; window.__by = b.y;`;
  await ev(`window.__bx = D.FD.S.C.x; window.__by = D.FD.S.C.y - 0.5; b.x = window.__bx; b.y = window.__by; M.cool = 99;`);
  await snap('01-idle', `${near} M.cool = 99;`, 1.2);
  await snap('02-idle-b', `${near} M.cool = 99;`, 0.9);
  await snap('03-slam-windup', `${near} window.__calDbg(FX, 'slam'); M.act.tx = b.x; M.act.ty = b.y + 2;`, 1.05);
  await ev(`S(2.5, () => { me.hp = D.ST.hp; }); M.cool = 99;`);
  await snap('04-slam-air', `${near} window.__keep = () => hold(b.x + 3, b.y + 4.5); window.__calDbg(FX, 'slam');`, 1.55);
  await ev(`S(2.5, () => { me.hp = D.ST.hp; }); M.cool = 99;`);
  await snap('05-spit', `${near} window.__calDbg(FX, 'spit');`, 0.9);
  await snap('06-spit-glob', `${near} M.cool = 99;`, 0.45);
  await ev(`S(2.0, () => { me.hp = D.ST.hp; }); M.cool = 99;`);
  // a cold field at the north well; the flan put just outside it
  await snap('07-field-on', `const w = A.wells[0]; A.activate(0); window.__bx = w.zx + 3.8; window.__by = w.zy + 3.2; ${near.replace('hold(b.x + 1.5, b.y + 4.2)', 'hold(w.px + 0.6, w.py + 0.4)')} M.fieldAt = FX.S.t - 20;`, 0.8);
  await snap('08-breaker-windup', `const w = A.wells[0]; window.__bx = w.zx + 1.6; window.__by = w.zy + 1.8; window.__keep = () => { hold(w.zx + 2.8, w.zy - 0.2); b.x = window.__bx; b.y = window.__by; }; M.lastBrk = -99; window.__calDbg(FX, 'breaker');`, 1.9);
  await snap('09-breaker-late', `M.cool = 99;`, 0.8);
  await ev(`S(2.0, () => { me.hp = D.ST.hp; }); M.cool = 99; A.restore();`);
  // chilled, then brittle: the flan in the zone with a field on
  await snap('10-chilling', `A.restore(); A.activate(1); const w = A.wells[1]; window.__bx = w.zx; window.__by = w.zy; window.__keep = () => { hold(w.zx - 2.5, w.zy + 3); b.x = window.__bx; b.y = window.__by; M.cool = 99; };`, 1.6);
  await snap('11-brittle', `M.cool = 99;`, 2.4);
  await snap('12-brittle-hit', `D.hitMon(b, 30, { flat: true }); D.hitMon(b, 30, { flat: true });`, 0.12);
  await ev(`A.endField(); M.brittle = false; M.chill = 0; S(1.5, () => { me.hp = D.ST.hp; }); A.restore(); A.cool = 0;`);
  // phase 2
  await ev(`window.__bx = D.FD.S.C.x; window.__by = D.FD.S.C.y - 0.5; b.hp = b.maxhp * 0.66; S(3.5, () => { me.hp = D.ST.hp; D.banners.length = 0; b.x = window.__bx; b.y = window.__by; hold(b.x + 1.5, b.y + 4.2); M.cool = 99; });`);
  await snap('13-phase2-lobes', `${near} M.cool = 99;`, 1.0);
  await snap('14-phase2-shed', `${near} window.__calDbg(FX, 'shed');`, 0.95);
  await snap('15-cinderlings', `${near} M.cool = 99; A.activate(2);`, 1.4);
  await snap('16-sweep', `${near} window.__calDbg(FX, 'sweep');`, 1.5);
  await snap('17-sweep-strike', `M.cool = 99;`, 0.75);
  await ev(`for (const m of D.mons) if (m.type === 'cinderling' && !m.dead) D.hitMon(m, 1e6, { flat: true }); A.endField(); A.cool = 0; S(1.5, () => { me.hp = D.ST.hp; }); A.restore();`);
  // phase 3
  await ev(`b.hp = b.maxhp * 0.3; S(3.6, () => { me.hp = D.ST.hp; D.banners.length = 0; b.x = window.__bx; b.y = window.__by; hold(b.x + 1.5, b.y + 4.2); M.cool = 99; });`);
  await snap('18-phase3-tall', `${near} M.cool = 99;`, 1.2);
  await snap('19-burst-windup', `${near} window.__calDbg(FX, 'burst');`, 1.9);
  await snap('20-burst-wave', `M.cool = 99;`, 1.05);
  await ev(`S(2.5, () => { me.hp = D.ST.hp; }); M.cool = 99;`);
  await snap('21-rush-windup', `A.restore(); A.activate(1); const w = A.wells[1]; window.__bx = D.FD.S.C.x - 3; window.__by = D.FD.S.C.y - 2; window.__keep = () => { hold(b.x - 2, b.y + 3.6); b.x = window.__bx; b.y = window.__by; }; window.__calDbg(FX, 'rush');`, 1.4);
  await ev(`window.__keep = null; S(2.5, () => { me.hp = D.ST.hp; }); M.cool = 99; A.restore();`);
  await snap('22-p3-brittle', `A.activate(1); const w = A.wells[1]; window.__bx = w.zx; window.__by = w.zy; window.__keep = () => { hold(w.zx - 2.5, w.zy + 3); b.x = window.__bx; b.y = window.__by; M.cool = 99; };`, 3.8);
  // the death
  await ev(`window.__keep = null; A.endField(); M.brittle = false; window.__bx = D.FD.S.C.x; window.__by = D.FD.S.C.y; b.x = window.__bx; b.y = window.__by; hold(b.x + 1, b.y + 4.5); D.hitMon(b, 1e9, { flat: true, pierce: true });`);
  await snap('23-death-a', `hold(window.__bx + 1, window.__by + 4.5);`, 0.9);
  await snap('24-death-b', ``, 1.4);
  await snap('25-death-c', ``, 1.6);
  console.log('errors:', errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)).slice(0, 10));
  await T.browser.close();
})().catch(e => { console.error(e); process.exit(1); });
