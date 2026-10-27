/* ---------- crystals and fusion: two pets become one, carrying traces of both parents ----------
   Crystals come 5 at a time from every cleared stage or floor (or 5000 for a $10 test purchase).
   A Fusion Stone costs 500 crystals. One fuses two pets into a new one, which frees a space in the house; merging a
   whole group takes two stones for three to six pets and three for seven or more. */

/* ---- genetics: one plan of coin flips, applied to every stage of both parents' lines so the child's history is coherent ---- */
const FUSE_X = ['gem', 'top', 'bud', 'crest', 'spikes', 'mane', 'horns', 'horns2', 'wings', 'marks', 'armor', 'pauldrons', 'orbs', 'aura', 'halo'];
function fusePlan(R) {
  const P = { pal: R(), hueMix: R(), sec: R() < 0.5, iris: R() < 0.5, belly: R() < 0.5, fur: R() < 0.5, bellyT: R() < 0.5, part: {}, x: {}, keepA: {}, keepB: {}, bodyMix: 0.35 + R() * 0.3 };
  ['pattern', 'mouth', 'nose', 'cheeks', 'eyes', 'ears', 'arms', 'legs', 'tail'].forEach(k => { P.part[k] = R() < 0.5; });
  const KEEP = ['horns', 'wings', 'armor', 'aura', 'halo', 'gem'];   // the features that mark a stage always carry over from whichever parent has them
  FUSE_X.forEach(k => { P.x[k] = R() < 0.5; P.keepA[k] = KEEP.includes(k) || R() < 0.8; P.keepB[k] = KEEP.includes(k) || R() < 0.8; });
  P.seed = Math.floor(R() * 1e9) + 1;
  return P;
}
const mixAngle = (a, b, t) => { let d = ((b - a) % 360 + 540) % 360 - 180; return ((a + d * t) % 360 + 360) % 360; };
function fuseStage(A, B, P, stage) {
  const cl = v => JSON.parse(JSON.stringify(v));
  const f = cl(A);
  f.seed = P.seed + stage; f.stage = stage;
  const m = P.bodyMix;
  ['h', 'w', 'headW', 'top', 'flat', 'waist'].forEach(k => { f.body[k] = r1(A.body[k] * (1 - m) + B.body[k] * m); });
  f.body.fur = P.fur ? B.body.fur : A.body.fur;
  f.body.belly = P.bellyT ? B.body.belly : A.body.belly;
  f.grow = r1((A.grow + B.grow) / 2);
  // coat: two hue coats blend into a new hue; a special coat wins over a plain one half the time
  const pa = A.pal, pb = B.pal;
  if (pa.id === 'hue' && pb.id === 'hue') {
    const R2 = mulberry32(P.seed ^ 0x51ED27);
    f.pal = huePal(mixAngle(pa.h, pb.h, P.hueMix), (pa.s + pb.s) / 2, (pa.l + pb.l) / 2, R2);
  } else f.pal = cl(P.pal < 0.5 ? pb : pa);
  const other = f.pal === A.pal || (pa.id !== 'hue' && P.pal >= 0.5) ? pb : pa;
  if (P.sec) f.pal.sec = other.sec;
  if (P.iris) f.pal.iris = other.iris;
  if (P.belly && f.pal.id === 'hue') f.pal.belly = other.belly;
  f.pal.name = f.pal.id === 'hue' ? colorName(f.pal.h, f.pal.s, f.pal.l) : f.pal.name;
  // parts
  ['pattern', 'mouth', 'nose', 'cheeks'].forEach(k => { f[k] = P.part[k] ? B[k] : A[k]; });
  ['eyes', 'ears', 'arms', 'legs', 'tail'].forEach(k => { f[k] = cl(P.part[k] ? B[k] : A[k]); });
  if (f.mouth === 'beak') f.nose = 'none';
  if (!P.part.eyes && P.part.ears) f.eyes.iris2 = B.eyes.iris2;
  if (LEG_ALIAS[f.legs.t]) f.legs.t = LEG_ALIAS[f.legs.t]; const ll = LEG_LEN[f.legs.t] || [0, 6]; f.legs.len = clamp(f.legs.len, ll[0], ll[1]);
  // features: both parents' gifts, mostly kept
  const XA = A.x || {}, XB = B.x || {}; f.x = {};
  FUSE_X.forEach(k => {
    const a = XA[k], b = XB[k];
    if (a != null && b != null) f.x[k] = cl(P.x[k] ? b : a);
    else if (a != null) { if (P.keepA[k]) f.x[k] = cl(a); }
    else if (b != null && P.keepB[k]) f.x[k] = cl(b);
  });
  // a fused pet carries both lines: two pairs of wings or a second set of horns when the parents each had their own
  if (XA.wings && XB.wings && XA.wings.t !== XB.wings.t && f.x.wings) { f.x.wings.n = Math.max(2, f.x.wings.n || 1); f.x.wings2 = (P.x.wings ? XA : XB).wings.t; }
  if (XA.horns && XB.horns && XA.horns.t !== XB.horns.t && f.x.horns && !f.x.horns2) f.x.horns2 = { t: (P.x.horns ? XA : XB).horns.t, size: 0.75 };
  if (A.tail.n > 1 || B.tail.n > 1) f.tail.n = Math.max(A.tail.n || 1, B.tail.n || 1);
  if (stage < 2) delete f.x.gem;
  return cleanForm(f) || cl(A);
}
/* the child's whole line of forms, stage by stage. Parents with a shorter line lend their last form */
function fuseLines(a, b, R) {
  const P = fusePlan(R), stage = Math.max(a.stage, b.stage), out = [];
  for (let s = 1; s <= stage; s++) {
    const A = a.forms[Math.min(s, a.forms.length) - 1], B = b.forms[Math.min(s, b.forms.length) - 1];
    out.push(fuseStage(A, B, P, s));
  }
  return out;
}
function fuseName(a, b) {
  const x = a.name.trim(), y = b.name.trim();
  const n = (x.slice(0, Math.max(2, Math.ceil(x.length / 2))) + y.slice(Math.floor(y.length / 2))).replace(/(.)\1{2,}/g, '$1$1');
  return (n.charAt(0).toUpperCase() + n.slice(1)).slice(0, 14) || 'Pip';
}
/* the child as a pet record, ready to unpack */
/* the three inheritable slots and what each parent (and the child's own roll) would put there */
const FUSE_SLOTS = ['normal', 'strong', 'ult'];
function fuseOwnAbility(p, slot) { const AB = applyAbOv(petAbility(formOf(p), p.dna.seed), p); return innateAbility(slot, AB, p); }
function fuseOptions(a, b, child) {
  const out = {};
  FUSE_SLOTS.forEach(slot => { out[slot] = { a: fuseOwnAbility(a, slot), b: fuseOwnAbility(b, slot), c: fuseOwnAbility(Object.assign({}, child, { abOv: null }), slot) }; });
  return out;
}
const fuseOvFrom = ab => ab.slot === 'normal' ? { shot: ab.key.slice(2) } : { key: ab.key, tier: ab.star || 3 };
/* star rank by fusion: the child takes its parents' rank (the higher, when they differ). Two or more of the same rank
   may rise one rank: three-stars 20% (+5% for each pet past two, up to 50%), four-stars 25% (+5% each, up to 50%),
   five-stars 5% (+1% each) to a six-star golden Legendary. Rolled only when the fusion really happens (up), never in a
   preview, so "Different mix" cannot reroll it into a certainty */
function fuseUpChance(stars, n) {
  n = Math.max(2, n || 2);
  if (stars === 3) return Math.min(0.5, 0.2 + 0.05 * (n - 2));
  if (stars === 4) return Math.min(0.5, 0.25 + 0.05 * (n - 2));
  if (stars === 5) return Math.min(1, GOLD_FUSE + 0.01 * (n - 2));
  return 0;
}
const fuseRank = (a, b) => Math.max(starsOf(a.rarity), starsOf(b.rarity));
const fuseCanRise = (a, b) => starsOf(a.rarity) === starsOf(b.rarity) && starsOf(a.rarity) < 6;
function fuseChild(a, b, seed, pick, up) {
  const R = mulberry32(seed >>> 0 || 7);
  const forms = fuseLines(a, b, R), f0 = forms[0];
  const dna = { v: 3, seed: f0.seed, personality: R() < 0.5 ? a.dna.personality : b.dna.personality, size: r1(clamp((a.dna.size + b.dna.size) / 2, 0.9, 1.1)) };
  const c = newPetFields(fuseName(a, b), { dna, form: f0 });
  c.forms = forms; c.stage = forms.length;
  // a golden parent passes its gold on; otherwise the parents' rank, perhaps one higher (see fuseUpChance)
  const rose = !!up && fuseCanRise(a, b), rank = fuseRank(a, b) + (rose ? 1 : 0);
  if (rank >= 6) gildPet(c, mulberry32(((seed >>> 0) ^ 0x1E6E7D) >>> 0));
  else { forms.forEach(f => { f.x = f.x || {}; f.x.rank = rank; if (rose) f.x.forged = 1; }); c.rarity = rarityOf(forms[forms.length - 1]); }
  c.rose = rose;
  c.xp = Math.max(a.xp, b.xp) + Math.round(Math.min(a.xp, b.xp) * 0.25);
  c.dlv = Math.max(a.dlv || 1, b.dlv || 1) + Math.floor(Math.min(a.dlv || 1, b.dlv || 1) / 3);
  c.meals = a.meals + b.meals; c.pats = a.pats + b.pats; c.bestStreak = Math.max(a.bestStreak, b.bestStreak);
  c.tricks = Object.assign({}, a.tricks, b.tricks);
  c.deck = cleanDeck(a.deck); SLOTS.forEach(k => { if (!c.deck[k]) c.deck[k] = cleanDeck(b.deck)[k]; });
  for (let n = 2; n <= c.stage; n++) c.paid[n] = true;
  c.fusedFrom = [a.name, b.name]; c.gen = Math.max(a.gen || 0, b.gen || 0) + 1;
  c.food = 85; c.joy = 90; c.energy = 95; c.clean = 100;
  if (pick) { const opts = fuseOptions(a, b, c), ov = {}; FUSE_SLOTS.forEach(slot => { const src = pick[slot]; if (src && src !== 'c' && opts[slot][src]) ov[slot] = fuseOvFrom(opts[slot][src]); }); c.abOv = Object.keys(ov).length ? ov : null; }
  return c;
}

/* ---- the crystal shop ---- */
// where a purchase was started: the Tower lobby's prompt goes straight back to the lobby
let crysFrom = null;
function openCrystalShop(short) {
  labCtx = false; crysFrom = null;
  openSheet('crystals', `
    <p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">Crystals</h2>
    <div class="egg-hero small crystal-hero">${ICON.crystal}</div>
    <p class="note">${short ? `You need ${fmtNum(short)} more crystals. ` : ''}You have <b>${fmtNum(st.crystals || 0)}</b> crystals${st.fusionStones ? ` and <b>${st.fusionStones}</b> Fusion Stone${st.fusionStones > 1 ? 's' : ''}` : ''}. Every Adventure stage you clear gives <b>${CRYSTALS_PER_STAGE} crystals</b> and every Tower floor <b>${CRYSTALS_PER_FLOOR}</b> (boss floors pay crystals on the first win only).</p>
    <div class="packs">
      <button class="pack" type="button" data-go="crystal-buy">${ICON.crystal}<b>${fmtNum(CRYSTAL_PACK)} crystals</b><span class="mono">${CRYSTAL_PRICE}</span></button>
      <button class="pack" type="button" data-go="stone-buy"${(st.crystals || 0) < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}<b>Fusion Stone</b><span class="mono">${FUSION_COST} crystals</span></button>
    </div>
    <p class="note"><b>Fusion Stone.</b> Fuses two of your pets into one new pet that keeps traces of both: a mix of their colours, body parts, wings and horns, with the higher stage and level of the two. Fusing frees up a space in your house.</p>
    ${petCount() >= 2 ? `<div class="evo-actions"><button class="btn primary" type="button" data-go="fusion">${ICON.fusion}Fuse two pets</button></div>` : '<p class="note">Hatch a second pet to try fusion.</p>'}
    <p class="note">Build a <b>Laboratory</b> in your house to fuse pets, shop and restyle your pet all in one place.</p>
    <p class="demo-note">Prototype: the ${CRYSTAL_PRICE} button is a test purchase and nothing is charged. In the real app it opens the App Store or Google Play payment sheet.</p>`);
}
function confirmCrystalBuy() {
  openSheet('crystals', `
    <p class="eyebrow">Test purchase</p><h2 class="title" id="sheetTitle">Buy ${fmtNum(CRYSTAL_PACK)} crystals?</h2>
    <div class="egg-hero small crystal-hero">${ICON.crystal}</div>
    <p class="note">In the store version this charges <b>${CRYSTAL_PRICE}</b> through the App Store or Google Play. This prototype charges nothing.</p>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="crystal-confirm">Get the crystals</button><button class="btn" type="button" data-go="${crysFrom === 'shop' ? 'shop' : labCtx ? 'laboratory' : 'crystals'}" data-tab="shop">Back</button></div>`);
}
function buyCrystals() {
  st.crystals = (st.crystals || 0) + CRYSTAL_PACK; updateHud(); saveSoon(); sfx.coin();
  toast(`Added ${fmtNum(CRYSTAL_PACK)} crystals (test purchase, nothing was charged)`);
  renderDungeon();
  if (crysFrom === 'tower') { crysFrom = null; closeSheet(); return; }
  if (crysFrom === 'shop') { openShop(); return; }
  if (labCtx) openLaboratory('shop'); else openCrystalShop();
}
function buyFusionStone() {
  if ((st.crystals || 0) < FUSION_COST) { sfx.wrong(); toast(`A Fusion Stone costs ${FUSION_COST} crystals. You have ${fmtNum(st.crystals || 0)}.`); return; }
  st.crystals -= FUSION_COST; st.fusionStones = (st.fusionStones || 0) + 1;
  updateHud(); saveSoon(); sfx.sparkle();
  toast(`Fusion Stone added. You have ${st.fusionStones}.`);
  if (sheetKind === 'shop') openShop(); else if (sheetKind === 'pocket') openPocket(); else if (labCtx) openLaboratory('shop'); else if (petCount() >= 2) openFusion(); else openCrystalShop();
}

/* ---- picking two pets and previewing their child ---- */
let fuseSel = { a: -1, b: 0, seed: 1 };
const fusePetAt = i => (i < 0 ? st : st.others[i]);
const allPets = () => [{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i })));
function openFusion() {
  if (!st || petCount() < 2) { openCrystalShop(); return; }
  if (fuseSel.a === fuseSel.b || !fusePetAt(fuseSel.a) || !fusePetAt(fuseSel.b)) { fuseSel = { a: -1, b: 0, seed: fuseSel.seed }; }
  fuseSel.seed = (fusePetAt(fuseSel.a).dna.seed * 31 + fusePetAt(fuseSel.b).dna.seed * 17 + (st.fuseRolls || 0)) >>> 0;
  openSheet('fusion', '');
  renderFusion();
}
function renderFusion() {
  if (sheetKind !== 'fusion' || !st) return;
  const a = fusePetAt(fuseSel.a), b = fusePetAt(fuseSel.b);
  if (!fuseSel.pick) fuseSel.pick = {};
  const opts = fuseOptions(a, b, fuseChild(a, b, fuseSel.seed));
  FUSE_SLOTS.forEach(slot => { if (!fuseSel.pick[slot]) { const o = opts[slot], t = k => o[k].star || 3; fuseSel.pick[slot] = t('a') > Math.max(t('b'), t('c')) ? 'a' : t('b') > Math.max(t('a'), t('c')) ? 'b' : 'c'; } });
  const child = fuseChild(a, b, fuseSel.seed, fuseSel.pick), cf = child.forms[child.forms.length - 1];
  const abRow = slot => { const o = opts[slot]; return `<div class="fab-row"><span class="fab-slot">${SLOT_INFO[slot].short || SLOT_INFO[slot].name}</span>${[['a', a.name], ['b', b.name], ['c', 'New roll']].map(([k, who]) => { const ab = o[k], E = ELEMENTS[ab.el] || ELEMENTS.spark; return `<button class="fab-opt${fuseSel.pick[slot] === k ? ' on' : ''}" type="button" data-go="fuse-ab" data-slot="${slot}" data-src="${k}" aria-pressed="${fuseSel.pick[slot] === k}"><span class="fab-art" style="--ec:${E.color}">${glyphSVG(ab.glyph)}</span><b>${esc(ab.name)}</b><small>${esc(who)}${ab.star ? ` · ${ab.star}★` : ''}</small></button>`; }).join('')}</div>`; };
  const tile = (slot, cur) => pocketGridHTML(allPets(), { cls: 'scroll', cur: (p, i) => i === cur, disabled: (p, i) => i === (slot === 'a' ? fuseSel.b : fuseSel.a), attr: (p, i) => `data-go="fuse-pick" data-slot="${slot}" data-i="${i}"${i === cur ? ' aria-current="true"' : ''}` });
  const stones = st.fusionStones || 0;
  const traits = traitList(cf).slice(0, 8).map(t => `<span class="trait" style="--rc:${RARITY[t.r].c}"><i></i>${esc(t.label)}</span>`).join('');
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">Fusion</p><h2 class="title" id="sheetTitle">Fuse two pets</h2>
    <p class="note">Two pets become one new pet with traces of both: colours blend, body parts come from either parent, and wings or horns can double up. It keeps the higher stage and level. Both parents say goodbye, which frees a space in your house.</p>
    <div class="fuse-stage">
      <div class="fuse-parent"><span class="ps-art">${petSVG(formOf(a), { frame: 'fit' })}</span><b>${esc(a.name)}</b></div>
      <span class="fuse-plus">${ICON.fusion}</span>
      <div class="fuse-parent"><span class="ps-art">${petSVG(formOf(b), { frame: 'fit' })}</span><b>${esc(b.name)}</b></div>
      <span class="fuse-arrow">→</span>
      <div class="fuse-child"><span class="ps-art">${petSVG(cf, { frame: 'fit', eyes: 'happy', mouth: 'open' })}</span><b>${esc(child.name)}</b><small>${esc(speciesName(cf))} · Stage ${child.stage} · Lv ${child.dlv}</small></div>
    </div>
    <div class="traits">${traits}</div>
    ${fuseGoldNote(a, b, 2)}
    <div class="evo-actions"><button class="btn small" type="button" data-go="fuse-roll">${ICON.dice}Different mix</button></div>
    <h3 class="sec">Inherit abilities</h3>
    <p class="note">Choose which Normal attack, Strong attack and Ultimate the child keeps: either parent's own, or a fresh roll of its own. Star-rank signatures carry over.</p>
    <div class="fab">${FUSE_SLOTS.map(abRow).join('')}</div>
    ${sameKindHTML()}
    <h3 class="sec">First parent</h3>${tile('a', fuseSel.a)}
    <h3 class="sec">Second parent</h3>${tile('b', fuseSel.b)}
    <div class="box"><div class="box-top"><span>Fusion Stones</span><span class="mono">${stones}</span></div>
      <p class="note">${stones ? 'Fusing uses one Fusion Stone.' : `You need a Fusion Stone: ${FUSION_COST} crystals in the crystal shop. You have ${fmtNum(st.crystals || 0)} crystals.`}</p>
      <div class="evo-actions">${stones ? `<button class="btn primary" type="button" data-go="fuse-go">${ICON.fusion}Fuse ${esc(a.name)} and ${esc(b.name)}</button>` : `<button class="btn primary" type="button" data-go="crystals">${ICON.crystal}Crystal shop</button>`}</div>
    </div>
    <p class="note">The mix shown is exactly what you get${fuseCanRise(a, b) ? `, unless it rises to ${starsOf(a.rarity) + 1}★${starsOf(a.rarity) === 5 ? ' and becomes a Legendary' : ''}` : ''}. "Different mix" rolls another combination of the same two parents.</p>`;
}
/* the star-rank chance, told where it applies: a golden parent, two of the same rank, or two of different ranks */
function fuseGoldNote(a, b, n) {
  const sa = starsOf(a.rarity), sb = starsOf(b.rarity), pc = v => `${Math.round(v * 100)}%`;
  const W = ['', '', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][n] || String(n);
  if (sa >= 6 || sb >= 6) return `<p class="note gold-note">${starsHTML(6)} A Legendary parent passes it on: the child will be a six-star Legendary, in colours all its own.</p>`;
  if (sa === 5 && sb === 5) return `<p class="note gold-note">${starsHTML(6)} ${W} five-stars: a <b>${pc(fuseUpChance(5, n))}</b> chance the child is born a six-star Legendary, with angel or dragon wings that grow as it evolves, a radiant aura and golden signature moves. It is decided when you fuse${n > 2 ? '' : '; merging more five-stars at once adds 1% for each'}.</p>`;
  if (sa === sb) return `<p class="note rank-note">${starsHTML(sa + 1)} ${W} ${sa}-star pets: a <b>${pc(fuseUpChance(sa, n))}</b> chance the child rises to ${sa + 1}★, with the signature moves of its new rank. It is decided when you fuse${n > 2 ? '' : `; merging more ${sa}-stars at once adds 5% for each, up to 50%`}.</p>`;
  return `<p class="note rank-note">${starsHTML(Math.max(sa, sb))} Different star ranks: the child takes the higher rank. Only pets of the same rank can rise.</p>`;
}
const bornGold = (a, b, child) => child.rarity >= 5 && starsOf(a.rarity) < 6 && starsOf(b.rarity) < 6;
const roseLine = (a, b, child) => bornGold(a, b, child) ? '<li><b>Born a six-star Legendary!</b></li>' : child.rose ? `<li><b>Rose to ${starsOf(child.rarity)}★!</b></li>` : '';
function fuseAbPick(slot, src) { if (!FUSE_SLOTS.includes(slot) || !['a', 'b', 'c'].includes(src)) return; fuseSel.pick = fuseSel.pick || {}; fuseSel.pick[slot] = src; sfx.boop(); renderFusion(); }
function fusePick(slot, i) {
  if (slot === 'a') { if (i === fuseSel.b) return; fuseSel.a = i; } else { if (i === fuseSel.a) return; fuseSel.b = i; }
  fuseSel.pick = null;
  st.fuseRolls = 0;
  fuseSel.seed = (fusePetAt(fuseSel.a).dna.seed * 31 + fusePetAt(fuseSel.b).dna.seed * 17) >>> 0;
  sfx.boop(); renderFusion();
}
function fuseRoll() { if (fuseSel.pick) FUSE_SLOTS.forEach(k => { if (fuseSel.pick[k] === 'c') fuseSel.pick[k] = null; }); st.fuseRolls = (st.fuseRolls || 0) + 1; fuseSel.seed = (fuseSel.seed * 1103515245 + 12345 + st.fuseRolls) >>> 0; sfx.boop(); renderFusion(); }
let fusing = false;
function fusePets() {
  if (!st || fusing || evolving || !(st.fusionStones > 0) || petCount() < 2) return;
  const ia = fuseSel.a, ib = fuseSel.b;
  if (ia === ib || !fusePetAt(ia) || !fusePetAt(ib)) return;
  const a = ia < 0 ? packPet() : st.others[ia], b = ib < 0 ? packPet() : st.others[ib];
  const child = fuseChild(a, b, fuseSel.seed, fuseSel.pick, fuseCanRise(a, b) && Math.random() < fuseUpChance(starsOf(a.rarity), 2)), cf = child.forms[child.forms.length - 1];
  fusing = true; closeSheet();
  if (act) endActivity(true);
  if (ball) removeBall();
  st.fusionStones--;
  fuseCinematic([a, b], child, () => {
    // the parents leave, the child moves in as the pet you play with
    const keep = st.others.filter((p, i) => i !== ia && i !== ib);
    if (ia >= 0 && ib >= 0) keep.push(packPet());
    st.others = keep;
    unpackPet(child);
    st.asleep = false;
    $('#evoTitle').textContent = `Meet ${child.name}!`;
    $('#evoText').textContent = `${/^[AEIOU]/.test(speciesName(cf)) ? 'An' : 'A'} ${speciesName(cf)} · Stage ${child.stage} of 7 · Level ${child.dlv}`;
    const perk = $('#evoPerk');
    perk.innerHTML = `<ul class="changes"><li>Born from ${esc(a.name)} and ${esc(b.name)}</li>${roseLine(a, b, child)}<li>${esc(RARITY[child.rarity].name)} · generation ${child.gen}</li><li>${esc(cf.pal.name)} coat, ${esc(tname('eyes', cf.eyes.t).toLowerCase())}, ${esc(tname('tail', cf.tail.t).toLowerCase())}</li></ul><span>You can rename ${esc(child.name)} on the pet card.</span>`;
    perk.hidden = false;
    $('#evoDone').hidden = false;
    unperch(); pet.use = null; pet.goal = null; pet.lift = 0; pet.liftV = 0;
    pet.stageS = petScaleTarget();
    buildPet(true); renderDecor(); buildCompanions(); updateHud(); updateRoomBar();
    levelSeen = 0;
    fusing = false;
    saveLocalNow(); Store.touch();
  });
}

/* ---- same kind: pets that share an element and a star rank, ready to merge in one go ---- */
function sameKindGroups() {
  const groups = new Map();
  allPets().forEach(({ p, i }) => { const k = petElement(p) + '|' + starsOf(p.rarity); if (!groups.has(k)) groups.set(k, { el: petElement(p), stars: starsOf(p.rarity), pets: [] }); groups.get(k).pets.push({ p, i }); });
  return [...groups.values()].filter(g => g.pets.length >= 2).sort((a, b) => b.stars - a.stars || b.pets.length - a.pets.length);
}
function sameKindHTML() {
  const groups = sameKindGroups(); if (!groups.length) return '';
  return `<h3 class="sec">Same kind</h3><p class="note">Pets that share an element and a star rank. "Pair" loads the two strongest into the slots; "Merge all" fuses the whole group one after another into a single pet, keeping the best abilities: two Fusion Stones for up to six pets, three for more. The more pets of one rank merge together, the better the chance the child rises a rank.</p>
    <div class="sk-list">${groups.map((g, gi) => { const E = E8[g.el], n = g.pets.length; return `<div class="sk-row"><span class="sk-kind"><em class="rx-el small" style="--ec:${E.color}"><i></i>${E.name}</em>${starsHTML(g.stars)}<b>× ${n}</b>${g.stars < 6 ? `<small class="sk-up">${Math.round(fuseUpChance(g.stars, n) * 100)}% to ${g.stars + 1}★</small>` : ''}</span><span class="sk-pets">${g.pets.slice(0, 6).map(({ p }) => `<span class="sk-art" title="${esc(p.name)}">${petSVG(formOf(p), { frame: 'fit' })}</span>`).join('')}${n > 6 ? `<small>+${n - 6}</small>` : ''}</span><span class="sk-acts"><button class="btn small" type="button" data-go="fuse-pair" data-g="${gi}">Pair</button>${n >= 3 ? `<button class="btn small primary" type="button" data-go="fuse-all" data-g="${gi}">Merge all (${fuseStonesFor(n)} ${ICON.fusion})</button>` : ''}</span></div>`; }).join('')}</div>`;
}
const byPower = (a, b) => ((b.p.dlv || 1) - (a.p.dlv || 1)) || ((b.p.stage || 1) - (a.p.stage || 1));
function fusePair(gi) {
  const g = sameKindGroups()[gi]; if (!g) return;
  const two = g.pets.slice().sort(byPower).slice(0, 2);
  fuseSel.a = two[0].i; fuseSel.b = two[1].i; fuseSel.pick = null; st.fuseRolls = 0;
  fuseSel.seed = (fusePetAt(fuseSel.a).dna.seed * 31 + fusePetAt(fuseSel.b).dna.seed * 17) >>> 0;
  sfx.boop(); renderFusion();
  setTimeout(() => { try { $('.fuse-stage', sheetEl).scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }, 50);
}
/* merge a whole group: fuse the two strongest, then fold each remaining pet into the child, best abilities kept */
function fuseAll(gi, go) {
  const g = sameKindGroups()[gi]; if (!g || fusing || evolving) return;
  const need = fuseStonesFor(g.pets.length);
  if ((st.fusionStones || 0) < need) { toast(`Merging ${g.pets.length} pets needs ${need} Fusion Stones. You have ${st.fusionStones || 0}.`); openCrystalShop(need * FUSION_COST); return; }
  if (!go) { openSheet('fusion', `<p class="eyebrow">Merge all</p><h2 class="title" id="sheetTitle">Merge ${g.pets.length} ${E8[g.el].name} ${g.stars}★ pets?</h2>
    <div class="sk-pets big">${g.pets.map(({ p }) => `<span class="sk-art" title="${esc(p.name)}">${petSVG(formOf(p), { frame: 'fit' })}</span>`).join('')}</div>
    ${fuseGoldNote(g.pets[0].p, g.pets[1].p, g.pets.length)}
    <p class="note">They fuse one after another into a single pet that keeps the best Normal, Strong and Ultimate among them, the highest stage and level. This uses <b>${need}</b> Fusion Stone${need > 1 ? 's' : ''} (you have ${st.fusionStones}). The others say goodbye.</p>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="fuse-all-go" data-g="${gi}">${ICON.fusion}Merge them</button><button class="btn" type="button" data-go="fusion">Back</button></div>`); return; }
  const list = g.pets.slice().sort(byPower).map(x => x.p), leadIn = list.includes(st);
  const uids = new Set(list.map(p => p.uid));
  let child = list[0];
  const bestPick = (a, b) => { const opts = fuseOptions(a, b, fuseChild(a, b, 1)), pick = {}; FUSE_SLOTS.forEach(slot => { const o = opts[slot], t = k => o[k].star || 3; pick[slot] = t('a') >= t('b') ? 'a' : 'b'; }); return pick; };
  // one roll for the whole group, its chance set by how many merge, given to the last fusion of the chain
  const up = g.stars < 6 && Math.random() < fuseUpChance(g.stars, list.length);
  for (let k = 1; k < list.length; k++) { const b = list[k], seed = (child.dna.seed * 31 + b.dna.seed * 17 + k) >>> 0; child = fuseChild(child, b, seed, bestPick(child, b), up && k === list.length - 1); }
  const gold0 = list.some(p => starsOf(p.rarity) >= 6);
  st.fusionStones -= need;
  fusing = true; closeSheet(); if (act) endActivity(true); if (ball) removeBall();
  const cf = child.forms[child.forms.length - 1];
  fuseCinematic(list, child, () => {
    // the parents leave; the child takes the lead pet's place if the lead was merged, else joins the others
    const keepOthers = st.others.filter(p => !uids.has(p.uid));
    if (leadIn) { st.others = keepOthers; unpackPet(child); } else { st.others = keepOthers.concat([child]); }
    if (st.party) st.party = st.party.filter(u => !uids.has(u));
    partyPets();
    st.asleep = false;
    $('#evoTitle').textContent = `Meet ${child.name}!`;
    $('#evoText').textContent = `Born from ${list.length} pets · ${speciesName(cf)} · Stage ${child.stage} of 7 · Level ${child.dlv}`;
    const perk = $('#evoPerk'); perk.innerHTML = `<ul class="changes"><li>${list.map(p => esc(p.name)).join(', ')} became one</li>${child.rose ? (starsOf(child.rarity) >= 6 && !gold0 ? '<li><b>Born a six-star Legendary!</b></li>' : `<li><b>Rose to ${starsOf(child.rarity)}★!</b></li>`) : ''}<li>${esc(RARITY[child.rarity].name)} · generation ${child.gen}</li><li>Keeps the best Normal, Strong and Ultimate of the group</li></ul>`; perk.hidden = false;
    $('#evoDone').hidden = false;
    unperch(); pet.use = null; pet.goal = null; pet.lift = 0; pet.liftV = 0; pet.stageS = petScaleTarget();
    buildPet(true); renderDecor(); buildCompanions(); updateHud(); updateRoomBar(); levelSeen = 0; fusing = false;
    saveLocalNow(); Store.touch();
  });
}

/* the Fusion Stone counter in the shop room */
function openStoneShop() {
  const stones = st.fusionStones || 0, cr = st.crystals || 0;
  openSheet('crystals', `
    <p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">Fusion Stones</h2>
    <div class="egg-hero small crystal-hero">${ICON.fusion}</div>
    <p class="note">A Fusion Stone fuses two pets into one. You have <b>${stones}</b> stone${stones === 1 ? '' : 's'} and <b>${fmtNum(cr)}</b> crystals.</p>
    <div class="packs egg-buy">
      <button class="pack" type="button" data-go="stone-buy"${cr < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}<b>Fusion Stone</b><span class="mono">${FUSION_COST} crystals</span></button>
      <button class="pack" type="button" data-go="crystals">${ICON.crystal}<b>Crystals</b><span class="mono">${fmtNum(CRYSTAL_PACK)} for ${CRYSTAL_PRICE}</span></button>
    </div>
    <div class="evo-actions"><button class="btn" type="button" data-go="fusion"${petCount() < 2 ? ' aria-disabled="true"' : ''}>${ICON.fusion}Fuse pets</button><button class="btn" type="button" data-go="pocket">${ICON.sparkle}Pocket dimension</button></div>`);
}

/* ---- the fusion cinematic: any number of parents circle in, collapse into light, and the child bursts out ---- */
function fuseCinematic(parents, child, onJoined) {
  const wrap = $('#evoWrap'), petBox = $('#evoPet'), gemBox = $('#evoGem'), n = parents.length, cf = child.forms[child.forms.length - 1];
  petBox.className = 'evo-pet fuse fuse-n' + Math.min(n, 6);
  petBox.innerHTML = parents.map((p, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2, r = n === 2 ? 34 : n === 3 ? 36 : 38; return `<div class="fuse-p" style="--fx:${(Math.cos(a) * r).toFixed(1)}%;--fy:${(Math.sin(a) * r * 0.8).toFixed(1)}%;--d:${(i * 0.12).toFixed(2)}s;--s:${n > 3 ? 0.72 : n === 3 ? 0.82 : 0.92}">${evoView(formOf(p))}</div>`; }).join('') + '<div class="fuse-core"></div>';
  $('#evoEyebrow').textContent = n > 2 ? `Fusion · ${n} pets` : 'Fusion';
  $('#evoTitle').textContent = n > 2 ? `${parents.slice(0, 3).map(p => p.name).join(', ')}${n > 3 ? ` and ${n - 3} more` : ''} are fusing!` : `${parents[0].name} and ${parents[1].name} are fusing!`;
  $('#evoText').textContent = n > 2 ? `${n - 1} Fusion Stones glow…` : 'The Fusion Stone glows…';
  $('#evoPerk').hidden = true; $('#evoDone').hidden = true;
  gemBox.innerHTML = ICON.fusion; gemBox.hidden = false; gemBox.style.animation = 'none'; void gemBox.offsetWidth; gemBox.style.animation = '';
  wrap.hidden = false; sfx.hum();
  const T = 1 + 0.5 * Math.min(n, 4);
  setTimeout(() => { petBox.classList.add('orbit'); sfx.sparkle(); }, 900);
  setTimeout(() => { petBox.classList.add('glowing'); gemBox.hidden = true; }, 900 + T * 600);
  setTimeout(() => {
    $('#evoFlash').classList.remove('go'); void $('#evoFlash').offsetWidth; $('#evoFlash').classList.add('go');
    petBox.className = 'evo-pet reveal';
    petBox.innerHTML = evoView(cf, { eyes: 'happy', mouth: 'open' }) + '<div class="fuse-burst">' + Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i / 14 * 360).toFixed(0)}deg;--c:${['#FF9BD2', '#FFE37A', '#7FD3F2', '#B983F5', '#8FE0A6'][i % 5]}"></i>`).join('') + '</div>';
    sfx.fanfare(); buzz && buzz(40);
    onJoined();
  }, 900 + T * 600 + 1500);
}
