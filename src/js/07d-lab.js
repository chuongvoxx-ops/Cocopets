/* ---------- the Laboratory: fusion, the crystal shop and the cosmetic studio in one room ---------- */
let labCtx = false, labTab = 'fuse';
const COSMETICS = [
  { id: 'coat', name: 'New coat colour', desc: 'Re-dye the whole coat in a fresh random colour.', cost: 120, icon: 'brush' },
  { id: 'rare', name: 'Rare coat', desc: 'A special coat such as Galaxy, Aurora, Golden or Prism.', cost: 450, icon: 'sparkle' },
  { id: 'eyes', name: 'Eye colour', desc: 'A new colour for the eyes.', cost: 60, icon: 'star' },
  { id: 'aura', name: 'Aura', desc: 'A glowing aura behind your pet. Buy again to switch style: glow, flame, stars.', cost: 250, icon: 'sparkle' },
  { id: 'halo', name: 'Halo or crown', desc: 'A floating ring, crown or star circlet. Buy again to switch style.', cost: 250, icon: 'star' },
];
const AURA_STYLES = ['glow', 'flame', 'stars'], HALO_STYLES = ['ring', 'crown', 'stars'];
const nextOf = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];

function openLaboratory(tab) {
  if (!st) return;
  labCtx = true; labTab = tab || labTab || 'fuse';
  const T = (id, label, ic) => `<button class="btn small" type="button" data-go="laboratory" data-tab="${id}" aria-pressed="${labTab === id}">${ICON[ic]}${label}</button>`;
  const cr = fmtNum(st.crystals || 0), stones = st.fusionStones || 0;
  let body = '';
  if (labTab === 'fuse') {
    body = `<div class="lab-hero"><span class="ps-art">${ICON.fusion}</span><div><b>Fusion chamber</b><small>Two pets become one new pet with traces of both. Uses one Fusion Stone.</small><small>You have <b>${stones}</b> Fusion Stone${stones === 1 ? '' : 's'} and <b>${cr}</b> crystals.</small></div></div>
      <div class="evo-actions">${petCount() >= 2 ? `<button class="btn primary" type="button" data-go="fusion">${ICON.fusion}Choose two pets to fuse</button>` : '<p class="note">Hatch a second pet to try fusion.</p>'}
      ${stones ? '' : `<button class="btn" type="button" data-go="laboratory" data-tab="shop">${ICON.crystal}Get a Fusion Stone</button>`}</div>`;
  } else if (labTab === 'shop') {
    body = `<p class="note">You have <b>${cr}</b> crystals${stones ? ` and <b>${stones}</b> Fusion Stone${stones > 1 ? 's' : ''}` : ''}. Every Adventure stage you clear gives <b>${CRYSTALS_PER_STAGE} crystals</b> and every Tower floor <b>${CRYSTALS_PER_FLOOR}</b> (boss floors pay crystals on the first win only).</p>
      <div class="packs">
        <button class="pack" type="button" data-go="crystal-buy">${ICON.crystal}<b>${fmtNum(CRYSTAL_PACK)} crystals</b><span class="mono">${CRYSTAL_PRICE}</span></button>
        <button class="pack" type="button" data-go="stone-buy"${(st.crystals || 0) < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}<b>Fusion Stone</b><span class="mono">${FUSION_COST} crystals</span></button>
      </div>
      <p class="demo-note">Prototype: the ${CRYSTAL_PRICE} button is a test purchase and nothing is charged. In the real app it opens the App Store or Google Play payment sheet.</p>`;
  } else {
    const f = formOf(st), X = f.x || {};
    const rows = COSMETICS.map(c => {
      const note = c.id === 'aura' && X.aura ? ` Now: ${X.aura}.` : c.id === 'halo' && X.halo ? ` Now: ${X.halo}.` : '';
      const can = (st.crystals || 0) >= c.cost;
      return `<div class="cos"><span class="cos-ic">${ICON[c.icon]}</span><div><b>${c.name}</b><small>${c.desc}${note}</small></div><button class="btn small${can ? ' primary' : ''}" type="button" data-go="cos" data-id="${c.id}"${can ? '' : ' aria-disabled="true"'}>${ICON.crystal}${c.cost}</button></div>`;
    }).join('');
    const strip = X.aura || X.halo ? `<div class="cos"><span class="cos-ic">${ICON.close}</span><div><b>Remove aura and halo</b><small>Free. Your pet goes back to its natural look.</small></div><button class="btn small" type="button" data-go="cos" data-id="clear">Free</button></div>` : '';
    body = `<div class="lab-hero"><span class="ps-art">${petSVG(f, { frame: 'fit', eyes: 'happy', mouth: 'smile' })}</span><div><b>${esc(st.name)}</b><small>${esc(f.pal.name)} coat · Stage ${st.stage}</small><small>You have <b>${cr}</b> crystals.</small></div></div>
      <div class="cos-list">${rows}${strip}</div>
      <p class="note">Changes apply to every stage your pet has reached, so the new look stays when you switch forms.</p>`;
  }
  openSheet('lab', `<p class="eyebrow">Laboratory</p><h2 class="title" id="sheetTitle">Laboratory</h2>
    <div class="lab-tabs">${T('fuse', 'Fusion', 'fusion')}${T('shop', 'Shop', 'crystal')}${T('studio', 'Studio', 'brush')}</div>${body}`);
}

function applyCosmetic(id) {
  if (!st) return;
  const c = COSMETICS.find(x => x.id === id), cost = c ? c.cost : 0;
  if (id !== 'clear' && !c) return;
  if ((st.crystals || 0) < cost) { sfx.wrong(); toast(`That costs ${cost} crystals. You have ${fmtNum(st.crystals || 0)}.`); return; }
  const R = mulberry32((Date.now() ^ (st.dna.seed * 7919)) >>> 0), cl = v => JSON.parse(JSON.stringify(v));
  const cur = formOf(st), X = cur.x || {};
  let msg = '';
  if (id === 'coat') {
    const pal = huePal(R() * 360, 48 + R() * 38, 56 + R() * 20, R);
    st.forms.forEach(f => { const keep = f.pal.iris; f.pal = cl(pal); f.pal.iris = keep; });
    msg = `${st.name} is now ${pal.name}`;
  } else if (id === 'rare') {
    const opts = SPECIAL_PALS.filter(p => p.id !== cur.pal.id), p = Object.assign({}, opts[Math.floor(R() * opts.length)]); delete p.w;
    st.forms.forEach(f => { f.pal = cl(p); });
    msg = `${st.name} has a ${p.name} coat`;
  } else if (id === 'eyes') {
    const iris = hsl2hex(R() * 360, 70, 48);
    st.forms.forEach(f => { f.pal.iris = iris; });
    msg = 'New eye colour';
  } else if (id === 'aura') {
    const a = X.aura ? nextOf(AURA_STYLES, X.aura) : AURA_STYLES[Math.floor(R() * 3)];
    st.forms.forEach(f => { f.x = f.x || {}; f.x.aura = a; });
    msg = `${a.charAt(0).toUpperCase() + a.slice(1)} aura added`;
  } else if (id === 'halo') {
    const h = X.halo ? nextOf(HALO_STYLES, X.halo) : HALO_STYLES[Math.floor(R() * 3)];
    st.forms.forEach(f => { f.x = f.x || {}; f.x.halo = h; });
    msg = `${h === 'crown' ? 'Crown' : h === 'ring' ? 'Halo' : 'Star circlet'} added`;
  } else if (id === 'clear') {
    st.forms.forEach(f => { if (f.x) { delete f.x.aura; delete f.x.halo; } });
    msg = 'Back to the natural look';
  }
  st.forms = st.forms.map(f => cleanForm(f) || f);
  st.crystals = (st.crystals || 0) - cost;
  buildPet(true); buildCompanions(); updateHud(); saveSoon();
  sfx.sparkle(); toast(msg);
  openLaboratory('studio');
}
$('#labBtnIc').innerHTML = ICON.flask;
$('#labBtn').addEventListener('click', () => { sfx.unlock(); openLaboratory(); });
