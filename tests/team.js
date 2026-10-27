// Team, from home: the dock's Team button; set the party; give any pet (not just the one you play) its abilities and
// accessories without changing which pet you play; play as another pet; the party and the gear survive a save; and in
// the Tower each member fights with its own cards and pieces. usage: node tests/team.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  const S = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Lead'); P.st.unlockAll = true; P.st.dlv = 30; P.st.dun.best = 30; P.st.energy = 100;
    for (let i = 0; i < 5; i++) { const gn = P.makeGenome(P.mulberry32(i * 31 + 9)), f = P.newPetFields('Pet' + i, gn); f.dlv = 20 + i; P.st.others.push(f); }
    P.st.party = null; P.partyPets();
    const card = P.dun.CARD_IDS.find(id => P.dun.CARDS[id].slot === 'strong'); P.st.cards[card] = 2;
    const A = P.acc, ring = A.rollAccessory(60, { t: 'ring', r: 4 }), neck = A.rollAccessory(60, { t: 'necklace', r: 3 }); A.accBank([ring, neck]);
    return { lead: P.st.uid, others: P.st.others.map(p => p.uid), ring: ring.u, ringAtk: ring.s.atk, neck: neck.u, card, party0: P.partyPets().map(p => p.uid) };
  });
  const pet = n => S.others[n];
  // 1. the dock's Team button opens the Team sheet
  const dock = await page.evaluate(() => { const b = document.querySelector('#btnTeam'); const r = b && b.getBoundingClientRect(); return b ? { w: Math.round(r.width), txt: b.textContent.trim(), vis: r.width > 30 && r.height > 30 } : null; });
  check(dock && dock.vis && /Team/.test(dock.txt), 'the home dock has a Team button');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/team-dock.png'), clip: { x: 0, y: 700, width: 390, height: 144 } });
  await page.click('#btnTeam'); await page.waitForTimeout(300);
  const t1 = await page.evaluate(() => ({ kind: window.__pp.sheetKind, slots: document.querySelectorAll('.team-panel .pt-pet.on').length, tiles: document.querySelectorAll('.team-grid .pk-pet').length }));
  check(t1.kind === 'team' && t1.slots === 4 && t1.tiles === 6, 'Team shows the party of four and all six pets');
  // 2. the party: a resting pet cannot join a full party; take one out, put it in
  const pick = uid => page.evaluate(uid => document.querySelector(`.team-grid [data-go="team-pick"][data-uid="${uid}"]`).click(), uid);
  await pick(pet(4)); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="team-party"]').click()); await page.waitForTimeout(150);
  const p1 = await page.evaluate(() => window.__pp.partyPets().map(p => p.uid));
  check(p1.length === 4 && !p1.includes(pet(4)), 'a full party turns a fifth pet away');
  await pick(pet(1)); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="team-party"]').click()); await page.waitForTimeout(150);
  await pick(pet(4)); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="team-party"]').click()); await page.waitForTimeout(150);
  const p2 = await page.evaluate(() => window.__pp.partyPets().map(p => p.uid));
  check(p2.length === 4 && !p2.includes(pet(1)) && p2.includes(pet(4)) && p2[0] === S.lead, 'taking one out makes room for another, and the leader stays');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/team-sheet.png') });
  await page.evaluate(() => { const s = document.querySelector('#sheet') || document.querySelector('.sheet'); if (s) s.scrollTop = s.scrollHeight; });
  await page.waitForTimeout(150); await page.screenshot({ path: path.resolve(__dirname, '../shots/team-sheet2.png') });
  await page.evaluate(() => { const s = document.querySelector('#sheet') || document.querySelector('.sheet'); if (s) s.scrollTop = 0; });
  // 3. abilities for Pet4 (not the pet you play): the card sheet opens for it, and only its deck changes
  await page.evaluate(() => document.querySelector('[data-go="team-slot"][data-slot="strong"]').click()); await page.waitForTimeout(250);
  const c1 = await page.evaluate(() => ({ kind: window.__pp.sheetKind, eyebrow: document.querySelector('.sheet .eyebrow, #sheet .eyebrow') ? [...document.querySelectorAll('.eyebrow')].map(e => e.textContent).join('|') : '', back: !!document.querySelector('[data-go="team"].team-back') }));
  check(c1.kind === 'cards' && /Pet4's abilities/.test(c1.eyebrow) && c1.back, 'a Strong slot opens the card sheet for that pet, with a way back');
  await page.evaluate(card => document.querySelector(`[data-go="card-pick"][data-id="${card}"]`).click(), S.card); await page.waitForTimeout(200);
  const c2 = await page.evaluate(([card, p4]) => { const P = window.__pp, o = P.st.others.find(x => x.uid === p4); return { mine: o.deck.strong === card, lead: P.st.deck.strong, playing: P.st.uid }; }, [S.card, pet(4)]);
  check(c2.mine && c2.lead !== S.card && c2.playing === S.lead, 'the card goes on Pet4 alone, and you still play the leader');
  await page.evaluate(() => document.querySelector('[data-go="team"].team-back').click()); await page.waitForTimeout(200);
  // 4. accessories for Pet4, then from the strip for Pet0, without switching
  await page.evaluate(() => document.querySelector('.team-panel [data-go="team-acc"][data-t="ring"]').click()); await page.waitForTimeout(250);
  const a1 = await page.evaluate(() => ({ kind: window.__pp.sheetKind, eyebrow: [...document.querySelectorAll('.eyebrow')].map(e => e.textContent).join('|'), strip: document.querySelectorAll('.acc-pets .acc-pet').length }));
  check(a1.kind === 'accs' && /Pet4's accessories/.test(a1.eyebrow) && a1.strip === 6, 'a ring slot opens the accessory sheet for that pet, with every pet in its strip');
  await page.evaluate(u => { document.querySelector(`[data-go="acc-pick"][data-u="${u}"]`).click(); }, S.ring); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="acc-eq"]').click()); await page.waitForTimeout(150);
  await page.evaluate(p0 => document.querySelector(`[data-go="acc-who"][data-uid="${p0}"]`).click(), pet(0)); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="acc-tab"][data-t="necklace"]').click()); await page.waitForTimeout(150);
  await page.evaluate(u => { document.querySelector(`[data-go="acc-pick"][data-u="${u}"]`).click(); }, S.neck); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('[data-go="acc-eq"]').click()); await page.waitForTimeout(150);
  const a2 = await page.evaluate(([p4, p0, ring, neck]) => { const P = window.__pp, o4 = P.st.others.find(x => x.uid === p4), o0 = P.st.others.find(x => x.uid === p0); const base = P.dun.petCombat(Object.assign({}, o4, { acc: { ring: null, bracelet: null, necklace: null } })), worn = P.dun.petCombat(o4);
    return { r: o4.acc.ring === ring, n: o0.acc.necklace === neck, leadRing: P.st.acc.ring, playing: P.st.uid, k: worn.atk / base.atk }; }, [pet(4), pet(0), S.ring, S.neck]);
  check(a2.r && a2.n && !a2.leadRing && a2.playing === S.lead, 'Pet4 wears the ring and Pet0 the necklace, and you still play the leader');
  check(Math.abs(a2.k - (1 + S.ringAtk)) < 0.03, "the ring adds to Pet4's own power");
  await page.screenshot({ path: path.resolve(__dirname, '../shots/team-accs.png') });
  await page.evaluate(() => document.querySelector('[data-go="team"].team-back').click()); await page.waitForTimeout(200);
  // 5. play as Pet4
  await page.evaluate(() => document.querySelector('[data-go="team-lead"]').click()); await page.waitForTimeout(250);
  const l1 = await page.evaluate(lead => { const P = window.__pp; return { playing: P.st.uid, party: P.partyPets().map(p => p.uid), ring: P.st.acc.ring, strong: P.st.deck.strong, kind: P.sheetKind }; }, S.lead);
  check(l1.playing === pet(4) && l1.party.includes(S.lead) && l1.ring === S.ring && l1.strong === S.card && l1.kind === 'team', 'playing as Pet4 brings its own gear, and the old leader stays in the party');
  // 6. a save and a load keep the party and every pet's gear
  const sv = await page.evaluate(([p0, neck]) => { const P = window.__pp, o = JSON.parse(JSON.stringify(P.serialize())), s = P.sanitize(o); const o0 = s.others.find(x => x.uid === p0); return { party: s.party, partyBefore: P.st.party.slice(), neck: o0 && o0.acc.necklace === neck, ring: s.acc.ring, strong: s.deck.strong }; }, [pet(0), S.neck]);
  check(JSON.stringify(sv.party) === JSON.stringify(sv.partyBefore) && sv.neck && sv.ring === S.ring && sv.strong === S.card, 'the party and the gear survive a save and a load');
  // 7. in the Tower, each member fights with its own pieces
  await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.party; }, null, { timeout: 15000 });
  const d1 = await page.evaluate(p0 => { const D = window.__pp.arc.game._dbg, P = window.__pp; const m = D.party.find(x => x.p.uid === p0); return m ? { hp: m.ST.hp, want: P.dun.petCombat(m.p).hp, hasNeck: !!(m.ST.acc && m.ST.acc.hp) } : null; }, pet(0));
  check(d1 && d1.hasNeck && d1.hp === d1.want, "a party member who isn't the leader brings its necklace's HP into the Tower");
  console.log(JSON.stringify({ t1, p2, c2, a2, l1, sv: { party: sv.party.length, neck: sv.neck }, d1 }));
  console.log(fails.length ? 'team FAIL: ' + fails.join('; ') : 'team OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
