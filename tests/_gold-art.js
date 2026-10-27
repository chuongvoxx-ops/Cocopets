// Golden Legendary pets: a few hatched from six-star eggs, drawn at every stage, against a five-star; and the checks that
// the gold survives evolving, saving and its abilities. usage: node tests/_gold-art.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1180, height: 760 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  const r = await page.evaluate(() => {
    const P = window.__pp, out = { rows: [] };
    P.quickStart('Gold');
    const seeds = [11, 23, 47, 91];
    let html = '<div id="goldgrid" style="position:fixed;inset:0;z-index:99999;background:#FFF8EC;display:grid;grid-template-columns:110px repeat(7,1fr);gap:4px;padding:8px;font:700 12px sans-serif">';
    html += '<div></div>' + [1, 2, 3, 4, 5, 6, 7].map(s => `<div style="text-align:center">${P.STAGES[s].name}</div>`).join('');
    seeds.forEach((sd, row) => {
      const R = P.mulberry32(sd), g = row < 3 ? P.summonGenome(6, R) : P.summonGenome(5, R), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7));
      out.rows.push(line.map(f => ({ gold: !!(f.x && f.x.gold), stars: P.starsOf(P.rarityOf(f)), wings: f.x.wings ? f.x.wings.n : 0, aura: f.x.aura || '', halo: f.x.halo || '', orbs: f.x.orbs || 0, lights: f.x.lights || 0, leg: JSON.stringify(f.x.leg || null), w2: f.x.wings2 || '', wt: f.x.wings ? f.x.wings.t : '', kind: f.x.leg ? f.x.leg.w : '', n7: f.x.leg ? f.x.leg.n7 || 0 : 0, eyes: f.eyes.t, clean: !!(P.cleanForm(JSON.parse(JSON.stringify(f))) || {}).x && !!P.cleanForm(JSON.parse(JSON.stringify(f))).x.gold })));
      html += `<div style="align-self:center">${row < 3 ? '6★ golden' : '5★'} #${sd}</div>` + line.map(f => `<div style="height:150px">${P.petSVG(f, { frame: 'fit' })}</div>`).join('');
    });
    html += '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelectorAll('#goldgrid svg').forEach(s => { s.style.width = '100%'; s.style.height = '100%'; });
    // colours: none alike; angel and dragon about even; coats of every hue
    { const U = new Set(), hues = Array(12).fill(0); const K = { angel: 0, dragon: 0, butterfly: 0, dragonfly: 0, crystal: 0 }, R2 = { circle: 0, light: 0, metal: 0, element: 0 }; for (let i = 0; i < 300; i++) { const f = P.summonGenome(6, P.mulberry32(5000 + i)).form, L = f.x.leg; U.add(f.pal.base + L.a + L.b + L.c); hues[Math.floor(f.pal.h / 30) % 12]++; K[L.w]++; R2[L.ring]++; } out.colours = { uniq: U.size, kinds: K, rings: R2, hues }; }
    // how wide the wings are drawn at each stage, against the body (the same pet's line)
    { const g = P.summonGenome(6, P.mulberry32(11)), line = P.evolveLine(g.form, 7, P.mulberry32(77)); out.drawn = line.map(f => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:300px'; d.innerHTML = P.petSVG(f, { frame: 'room' }); document.body.appendChild(d); const w = d.querySelector('.p-wings').getBBox().width; d.remove(); return Math.round(w); }); }
    // the pairs of each kind of wing, fanned: the angles each spans past the body never meet another's, and stay below upright
    // (the fourth pair holds still: the others' widest swing down is counted against it)
    out.fans = []; for (const w of ['angel', 'dragon', 'butterfly', 'dragonfly', 'crystal']) for (const n of (w === 'butterfly' ? [1] : w === 'crystal' ? [1, 2, 3] : [1, 2, 3, 4])) for (const v of (w === 'dragonfly' || w === 'butterfly' || w === 'crystal' ? [0, 0.5, 1] : [0.5])) { const L = { w, a: '#FFFFFF', b: '#888888', c: '#FF0000', v, sg: 7 }, Y = P.legLayout(L, n), sc = [1, 0.82, 0.72, 0.56];
      const R = Y.rot.map((r, i) => { const q = P.legRange(L, sc[i], i === 3 ? Y.f4 : i ? Y.fo : Y.f0); return [q[0] + r - (i < 3 ? Y.down : 0), q[1] + r + (i < 3 ? Y.up : 0), i]; }).sort((a, b) => a[0] - b[0]);
      let gap = 99; for (let i = 1; i < R.length; i++) { const g2 = R[i][0] - R[i - 1][1] + (R[i][2] < 3 && R[i - 1][2] < 3 ? Y.up + Y.down : 0); gap = Math.min(gap, g2); }
      out.fans.push({ w, n, v, gap: Math.round(gap), top: Math.round(R[R.length - 1][1]), bot: Math.round(R[0][0]) }); }
    // how big it stands in the room, stage by stage: the picture's body height times its room scale, against the stage
    // before (each 5 to 10% more), and the pet drawn in the room at that scale, measured (its body, without the wings)
    out.sizes = [11, 23, 47, 5].map(sd => { const g = P.summonGenome(6, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), p = P.newPetFields('S', g); p.forms = line;
      const hs = []; for (let s = 1; s <= 7; s++) { p.stage = s; const fn = line[s - 1], d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:150px;height:150px';
        d.innerHTML = P.petSVG(fn, { frame: 'room' }); document.body.appendChild(d); const svgE = d.querySelector('svg'), bp = [...svgE.querySelectorAll('path')].filter(q => !q.closest('defs') && /^M/.test(q.getAttribute('d') || '')).find(q => q.getAttribute('d') === svgE.querySelector('clipPath path').getAttribute('d')), h = bp ? svgE.getBoundingClientRect().bottom - bp.getBoundingClientRect().top : -1; d.remove(); hs.push(h * P.legScale(p)); }
      return hs.slice(1).map((h, i) => +(h / hs[i]).toFixed(3)); });
    // its abilities: a six-star kit, from the golden pools, at x1.5
    const gn = P.summonGenome(6, P.mulberry32(5)), pet = P.newPetFields('Goldie', gn), K = P.dun.petKit(pet).kit;
    out.kit = { strong: K.strong.key, strongStar: K.strong.star, strongMult: K.strong.mult, ult: K.ult.key, ultStar: K.ult.star, ultMult: K.ult.mult, rarity: pet.rarity, stars: P.starsOf(pet.rarity) };
    // the odds of an egg
    const tally = { 3: 0, 4: 0, 5: 0, 6: 0 }, RR = P.mulberry32(99); for (let i = 0; i < 200000; i++) tally[P.rollStars(RR)]++; out.tally = tally;
    // saved and loaded
    P.st.others.push(pet); const saved = JSON.parse(JSON.stringify(P.serialize ? P.serialize() : P.st)); const back = P.sanitize ? P.sanitize(saved) : null;
    const bp = back && back.others ? back.others.find(p => p.name === 'Goldie') : null; out.loaded = bp ? { rarity: bp.rarity, gold: !!(bp.forms[0].x || {}).gold, stars: P.starsOf(bp.rarity) } : null;
    // a golden pet saved by the last version (gold, two pairs of wings and orbs, no colours of its own) loads as a Legendary of today
    { const g = P.summonGenome(6, P.mulberry32(8)), line = P.evolveLine(g.form, 4, P.mulberry32(9)), p = P.newPetFields('Old', g); p.forms = line; p.stage = 4;
      p.forms.forEach(f => { delete f.x.leg; delete f.x.lights; f.x.wings = { t: 'feather', size: 1, n: 2 }; f.x.wings2 = 'bat'; f.x.orbs = 4; });
      P.st.others = [p]; const b2 = P.sanitize(JSON.parse(JSON.stringify(P.st))).others[0], fs = b2.forms;
      out.old = { kind: fs[0].x.leg && fs[0].x.leg.w, n7: fs[0].x.leg && fs[0].x.leg.n7, leg: fs.every(f => f.x.leg && JSON.stringify(f.x.leg) === JSON.stringify(fs[0].x.leg)), pairs: fs.map(f => f.x.wings.n).join(''), lights: fs.map(f => f.x.lights || 0).join(''), orbs: fs.some(f => f.x.orbs), w2: fs.some(f => f.x.wings2), stars: P.starsOf(b2.rarity) }; P.st.others = []; }
    return out;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/gold-pets.png') });
  r.rows.forEach((row, i) => console.log(`  row ${i}: ` + row.map(s => `${s.stars}★${s.gold ? 'g' : ''} w${s.wings}${s.aura ? ' ' + s.aura : ''}${s.halo ? ' ' + s.halo : ''}${s.orbs ? ' o' + s.orbs : ''}`).join(' | ')));
  const L3 = r.rows.slice(0, 3);
  ok(L3.every(row => row.every(s => s.gold && s.stars === 6 && s.aura === 'gold' && s.clean)), 'Legendaries are six-star with a radiant aura at every stage, and keep it when saved');
  const wantPairs = s0 => s0.kind === 'butterfly' ? '1111222' : s0.kind === 'crystal' ? '1111223' : s0.kind === 'dragonfly' ? '111222' + (s0.n7 === 4 ? 4 : 3) : '1122334';
  ok(L3.every(row => row.map(s => s.wings).join('') === wantPairs(row[0])), `wing pairs by stage: ${L3.map(row => row[0].kind + ' ' + row.map(s => s.wings).join('')).join(', ')} (angel/dragon one, then more, four at Celestial; butterfly one great pair; dragonfly one, two, six or eight wings at Celestial)`);
  ok(L3.every(row => row.every(s => s.leg === row[0].leg && s.leg !== 'null' && !s.w2 && s.wt === row[0].wt && ['feather', 'bat', 'butterfly', 'fairy', 'crystal'].includes(s.wt))), 'each keeps its own kind of wings, in its own colours, at every stage (all pairs alike)');
  ok(L3.every(row => row.every((s, i) => s.lights === (i === 6 ? 4 : i ? 2 : 0) && !s.orbs)), 'two orbiting lights from Baby on (none at hatching), four at Celestial, no orbs');
  ok(L3.every(row => row[2].halo && row[6].halo === 'crown'), 'a halo from Junior, a crown at Celestial');
  ok(L3.every(row => row.every(s => ['round', 'big', 'sparkle', 'star', 'heart', 'button', 'oval', 'cat', 'hetero'].includes(s.eyes))), `cute eyes all the way (${L3.map(row => row[6].eyes).join(', ')})`);
  console.log('  fans', JSON.stringify(r.fans));
  ok(r.fans.every(F => F.gap >= 8 && F.top <= 90 && F.bot >= -100), `the pairs never overlap, even at the top of a beat (closest gap ${Math.min(...r.fans.map(F => F.gap))}°, highest reach ${Math.max(...r.fans.map(F => F.top))}°)`);
  console.log('  sizes', JSON.stringify(r.sizes));
  ok(r.sizes.every(row => row.every(v => v >= 1.045 && v <= 1.105)), 'in the room each evolution stands 5 to 10% bigger than the last');
  console.log('  colours', JSON.stringify(r.colours));
  ok(r.colours.uniq === 300 && Object.values(r.colours.kinds).every(n => n > 25) && Object.values(r.colours.rings).every(n => n > 30) && r.colours.hues.every(n => n > 8), `300 Legendaries: ${r.colours.uniq} different colourings, wings ${JSON.stringify(r.colours.kinds)}, rings ${JSON.stringify(r.colours.rings)}, coats of every hue (${r.colours.hues.join(' ')})`);
  ok(r.drawn.every((v, i) => !i || v > r.drawn[i - 1]), `wings drawn larger at every stage (spans ${r.drawn.join(', ')})`);
  ok(r.rows[3].every(s => !s.gold && s.stars === 5), 'a five-star stays a five-star');
  console.log('  kit', JSON.stringify(r.kit));
  ok(r.kit.stars === 6 && r.kit.strongStar === 6 && r.kit.ultStar === 6 && r.kit.strongMult >= 1.5 && r.kit.ultMult >= 1.5, 'a six-star hatchling has golden Strong and Ultimate at x1.5');
  console.log('  eggs', JSON.stringify(r.tally));
  ok(Math.abs(r.tally[6] / 2000 - 1) < 0.15 && Math.abs(r.tally[3] / 2000 - 84) < 1, `egg odds: ${(r.tally[6] / 2000).toFixed(2)}% six-star`);
  console.log('  loaded', JSON.stringify(r.loaded));
  ok(r.loaded && r.loaded.rarity === 5 && r.loaded.gold && r.loaded.stars === 6, 'a golden pet survives saving and loading');
  console.log('  old', JSON.stringify(r.old));
  ok(r.old.leg && r.old.pairs === wantPairs(r.old).slice(0, 4) && r.old.lights === '0222' && !r.old.orbs && !r.old.w2 && r.old.stars === 6, 'a golden pet from v72 loads with colours of its own, wings and lights by stage');
  console.log('errors', errors.length, errors.slice(0, 3)); ok(!errors.length, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
