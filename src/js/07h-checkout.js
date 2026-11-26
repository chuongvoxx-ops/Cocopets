/* ---------- v460 META: the shop packages and the checkout ----------
   Fusion Stone packs are bought in the game with crystals: 10 stones for 1,000 crystals, 20 for 1,500 (STONE_PACKS). One
   purchase checks the balance, takes the crystals, gives the stones and saves, all in one synchronous step; a button
   pressed twice before the screen redraws is processed once (each drawn button carries a one-time token).
   Crystal packs are real-money purchases: 5,000 crystals for 10 and 20,000 for 20, in the store's currency
   (CRYSTAL_PACKS). This static web build has NO payment system and NO server, so nothing can be sold here. STORE_CFG is
   the store's checkout setup and is empty: no currency is configured (none is guessed: not USD, not AUD), so players see
   "Checkout not set up" and cannot buy. A developer can turn on the DEVELOPMENT-ONLY mock checkout (Developer tools,
   st.devPay) to walk the whole flow (success, cancelled, failed, a repeated callback) with no money involved; every
   screen of it says so.
   What a real integration still needs (not done here):
   1. a payment provider: Stripe Checkout for the website, or App Store / Google Play billing for an app build, with one
      product per crystal pack priced in the store's currency, and that currency set in STORE_CFG;
   2. a server endpoint that verifies each payment with the provider (a Stripe webhook, checkout.session.completed, its
      signature checked; App Store Server API / Google Play Developer API purchase verification) and grants the crystals
      to the account ONCE per transaction id (its own ledger: a repeated webhook or a replayed receipt grants nothing),
      then acknowledges / finishes the purchase with the provider;
   3. receipt storage on that server (transaction id, product, amount, currency, account, time, status, refunds);
   4. the client then reads its crystals from the account the server updated, never granting them itself.
   The client side keeps that shape already: Checkout.complete(ev) grants only a verified success, once per transaction
   id, recorded in the save's ledger (st.payTx, 04-state) in the same save as the crystals */
const STORE_CFG = { currency: null, provider: null, test: true };   // (e.g. { currency: 'EUR', provider: 'stripe' } once checkout is set up)
/* v462b: until a payment provider is connected, crystal packs are TEST PURCHASES like the treasure box and the egg (the
   user's choice: "Just do fake money like before we can set up payment later"): shown at $10.00 / $20.00 · test purchase,
   nothing is charged, the crystals are added at once through Checkout (one ledger entry per test transaction, m: 2).
   Set test: false to get the "Checkout not set up" state back; a configured provider always takes over. */
const testBuy = () => !checkoutReady() && !!STORE_CFG.test && !(st && st.devPay);
const testPrice = n => '$' + Number(n).toFixed(2);
const STONE_PACKS = [{ id: 'fs10', stones: 10, cost: 1000 }, { id: 'fs20', stones: 20, cost: 1500 }];
const CRYSTAL_PACKS = [{ id: 'cr5k', crystals: 5000, price: 10 }, { id: 'cr20k', crystals: 20000, price: 20 }];
const STONES_MAX = 999;   // (the save's cap on Fusion Stones, 04-state)
const nComma = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // (the packages' amounts written out in full: 1,000 and 20,000, never 20.0k)
const storeCurrency = () => { const c = STORE_CFG.currency; return typeof c === 'string' && /^[A-Z]{3}$/.test(c) ? c : null; };
const checkoutReady = () => !!(storeCurrency() && STORE_CFG.provider);
/* a crystal pack's price in the store's currency, or the setup it is waiting for */
function storePrice(amount) {
  const cur = storeCurrency();
  if (!cur) return { ok: false, text: 'Checkout not set up', why: 'No store currency is configured' };
  let text = `${amount} ${cur}`; try { text = new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(amount); } catch (e) {}
  return { ok: true, text };
}
const packOf = id => CRYSTAL_PACKS.find(p => p.id === id) || null;
const stonePackOf = id => STONE_PACKS.find(p => p.id === id) || null;

/* ---- Fusion Stone packs: crystals in, stones out, once ---- */
let stoneTokN = 0; const stoneToks = new Set();
const stoneTok = () => 'k' + (++stoneTokN).toString(36) + Math.random().toString(36).slice(2, 6);
function stonePacksHTML() {
  const cr = st.crystals || 0;
  return `<div class="packs stone-packs">${STONE_PACKS.map(P => `<button class="pack" type="button" data-go="stone-pack" data-id="${P.id}" data-tok="${stoneTok()}"${cr < P.cost ? ' aria-disabled="true"' : ''} aria-label="Buy ${P.stones} Fusion Stones for ${nComma(P.cost)} crystals">${ICON.fusion}<b>${P.stones} Fusion Stones</b><span class="mono">${nComma(P.cost)} crystals</span></button>`).join('')}</div>`;
}
/* the one transaction: validate, take, give, save. Returns { ok, why } (why: bad, duplicate, funds, cap) */
function buyStonePack(id, tok) {
  const P = stonePackOf(id); if (!P || !st) return { ok: false, why: 'bad' };
  if (tok && stoneToks.has(tok)) return { ok: false, why: 'duplicate' };
  const have = st.crystals || 0, stones = st.fusionStones || 0;
  if (have < P.cost) { sfx.wrong(); toast(`Not enough crystals: ${P.stones} Fusion Stones cost ${nComma(P.cost)} crystals and you have ${nComma(have)} (${nComma(P.cost - have)} short).`, 3600); return { ok: false, why: 'funds', short: P.cost - have }; }
  if (stones + P.stones > STONES_MAX) { sfx.wrong(); toast(`You can hold up to ${STONES_MAX} Fusion Stones (you have ${stones}).`); return { ok: false, why: 'cap' }; }
  if (tok) stoneToks.add(tok);
  st.crystals = have - P.cost; st.fusionStones = stones + P.stones;
  saveLocalNow(); Store.touch(); updateHud(); sfx.sparkle();
  toast(`${P.stones} Fusion Stones added for ${nComma(P.cost)} crystals. You have ${st.fusionStones}.`);
  return { ok: true };
}

/* the screen the stones were bought from, drawn again (with new one-time tokens) */
function stonesRedraw() {
  if (sheetKind === 'shop') renderShop(); else if (sheetKind === 'team') renderTeam(); else if (sheetKind === 'fusion') renderFusion();
  else if (labCtx) openLaboratory('shop'); else if (sheetKind === 'crystals') openCrystalShop();
}

/* ---- crystal packs: the checkout ---- */
const Checkout = {
  open: new Map(),   // transactions begun in this session: id -> pack id
  log: [],           // (the mock's screen: what each callback did)
  /* start buying a pack: the real provider (none configured) or the development-only mock */
  begin(packId) {
    const P = packOf(packId); if (!P || !st) return { ok: false, why: 'bad' };
    if (checkoutReady()) return { ok: false, why: 'no-provider' };   // (a real provider would be called here; none exists in this build)
    if (testBuy()) { const id = 'test_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); this.open.set(id, P.id); return { ok: true, id, test: true }; }   // v462b
    if (!st.devPay) return { ok: false, why: 'setup' };
    const id = 'mock_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    this.open.set(id, P.id);
    return { ok: true, id, mock: true };
  },
  /* the provider's result for one transaction (from the server that verified it, in a real build; from the mock here).
     ev = { id, pack, status: 'success' | 'cancelled' | 'failed', verified, mock }. Grants only a verified success,
     once per id; everything else changes nothing. Returns { ok, why, crystals } */
  complete(ev) {
    if (!st || !ev || typeof ev.id !== 'string') return { ok: false, why: 'bad' };
    const P = packOf(ev.pack); if (!P) return { ok: false, why: 'bad' };
    if ((st.payTx || []).some(t => t.id === ev.id)) return { ok: false, why: 'duplicate' };
    if (ev.status === 'cancelled') { this.open.delete(ev.id); return { ok: false, why: 'cancelled' }; }
    if (ev.status !== 'success') { this.open.delete(ev.id); return { ok: false, why: 'failed' }; }
    if (!ev.verified) return { ok: false, why: 'unverified' };
    if (ev.mock && !st.devPay) return { ok: false, why: 'mock-off' };
    if (ev.test && !testBuy()) return { ok: false, why: 'test-off' };   // v462b
    if (this.open.get(ev.id) !== P.id) return { ok: false, why: 'unknown' };   // (only a transaction this client began, for this pack)
    st.crystals = (st.crystals || 0) + P.crystals;
    st.payTx = (st.payTx || []).concat([{ id: ev.id, p: P.id, at: Date.now(), m: ev.mock ? 1 : ev.test ? 2 : 0 }]).slice(-1000);
    this.open.delete(ev.id);
    saveLocalNow(); Store.touch(); updateHud();
    return { ok: true, crystals: P.crystals };
  },
};
function crystalPacksHTML() {
  const mock = !!st.devPay && !checkoutReady(), test = testBuy();
  return `<div class="packs crystal-packs">${CRYSTAL_PACKS.map(P => { const pr = storePrice(P.price), on = pr.ok || mock || test; return `<button class="pack${on ? '' : ' unset'}" type="button" data-go="crystal-pack" data-id="${P.id}"${on ? '' : ' aria-disabled="true"'}>${ICON.crystal}<b>${nComma(P.crystals)} crystals</b><span class="mono">${mock ? 'Mock checkout · dev only' : test ? `${testPrice(P.price)} · test purchase` : esc(pr.text)}</span></button>`; }).join('')}</div>`;
}
function checkoutNoteHTML() {
  if (checkoutReady()) return '';
  if (testBuy()) return `<p class="demo-note">Prototype: the crystal packs are test purchases and nothing is charged. Real payment will be connected later.</p>`;   // v462b
  return `<p class="demo-note pay-setup"><b>Checkout setup required.</b> Crystal packs (${CRYSTAL_PACKS.map(P => `${nComma(P.crystals)} crystals for ${P.price}`).join(', ')} in the store's currency) can't be bought yet: no payment provider or store currency is connected to this game.${st.devPay ? ' The development-only mock checkout is on (Developer tools): it charges nothing and is not a real purchase.' : ''}</p>`;
}
/* a crystal pack tapped: the mock (developers), or what checkout is still missing */
function crystalPackTap(id) {
  const P = packOf(id); if (!P) return;
  const r = Checkout.begin(id);
  if (r.ok && r.test) { Checkout.open.delete(r.id); confirmCrystalTest(P); return; }   // v462b
  if (r.ok) { openMockCheckout(r.id, P); return; }
  sfx.wrong();
  openSheet('crystals', `<p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">${nComma(P.crystals)} crystals</h2>
    <div class="egg-hero small crystal-hero">${ICON.crystal}</div>
    <p class="note"><b>Checkout is not set up in this build.</b> This pack costs ${P.price} in the store's currency, and the store has no currency or payment provider configured yet, so it cannot be bought. Nothing was charged and no crystals were added.</p>
    <p class="note">Crystals also come from play: every Adventure stage you clear gives ${CRYSTALS_PER_STAGE}, every Tower floor ${CRYSTALS_PER_FLOOR}, every treasure box ${fmtNum(GIFT_CRYSTALS)}.</p>
    <div class="evo-actions"><button class="btn" type="button" data-go="shop" data-sec="crystals">Back to the Shop</button></div>`);
}
/* v462b: a crystal pack as a test purchase: confirm, then the crystals are added (nothing charged) */
function confirmCrystalTest(P) {
  openSheet('crystals', `<p class="eyebrow">Test purchase</p><h2 class="title" id="sheetTitle">Buy ${nComma(P.crystals)} crystals?</h2>
    <div class="egg-hero small crystal-hero">${ICON.crystal}</div>
    <p class="note">In the store version this charges <b>${testPrice(P.price)}</b>. This prototype charges nothing.</p>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="crystal-test" data-id="${P.id}">Get ${nComma(P.crystals)} crystals</button><button class="btn" type="button" data-go="shop" data-sec="crystals">Back</button></div>`);
}
function crystalTestBuy(id) {
  const P = packOf(id); if (!P) return null;
  const r = Checkout.begin(id); if (!r.ok || !r.test) { crystalPackTap(id); return null; }
  const res = Checkout.complete({ id: r.id, pack: P.id, status: 'success', verified: true, test: true });
  if (!res.ok) { sfx.wrong(); return res; }
  sfx.coin(); toast(`Added ${nComma(res.crystals)} crystals (test purchase, nothing charged). You have ${nComma(st.crystals)}.`);
  try { renderDungeon(); } catch (e) {}
  openShop('crystals');
  return res;
}
/* the development-only mock checkout: no money, no provider; it calls Checkout.complete as a verified server would */
let mockTx = null;
function openMockCheckout(id, P) {
  mockTx = { id, pack: P.id, res: [] };
  renderMockCheckout();
}
function renderMockCheckout() {
  if (!mockTx) return; const P = packOf(mockTx.pack), pr = storePrice(P.price);
  const R = { ok: 'Crystals added', duplicate: 'Duplicate callback: ignored, nothing added', cancelled: 'Cancelled: nothing charged, nothing added', failed: 'Payment failed: nothing added', unknown: 'Unknown transaction: nothing added', unverified: 'Not verified: nothing added', 'mock-off': 'Mock checkout is off: nothing added', bad: 'Invalid: nothing added' };
  openSheet('checkout', `<p class="eyebrow mock-eyebrow">Development only · not a real purchase</p><h2 class="title" id="sheetTitle">Mock checkout</h2>
    <div class="mock-banner"><b>DEVELOPMENT-ONLY MOCK</b><span>No payment provider, no money, no receipt. This screen only tests how the game handles a payment result. Players never see it: it exists only while "Mock checkout" is on in the Developer tools.</span></div>
    <div class="mock-pack">${ICON.crystal}<div><b>${nComma(P.crystals)} crystals</b><small>Price ${P.price} in the store's currency · ${pr.ok ? esc(pr.text) : 'store currency not configured'}</small><small class="mono">transaction ${esc(mockTx.id)}</small></div></div>
    <div class="evo-actions mock-acts">
      <button class="btn primary" type="button" data-go="pay-mock" data-r="success">Simulate a successful payment</button>
      <button class="btn" type="button" data-go="pay-mock" data-r="cancelled">Simulate cancel</button>
      <button class="btn" type="button" data-go="pay-mock" data-r="failed">Simulate failure</button>
      <button class="btn" type="button" data-go="pay-mock" data-r="dup">Send the success callback again</button>
    </div>
    ${mockTx.res.length ? `<ol class="mock-log">${mockTx.res.map(r => `<li class="${r === 'ok' ? 'ok' : ''}">${esc(R[r] || r)}</li>`).join('')}</ol>` : ''}
    <p class="note">You have <b>${nComma(st.crystals || 0)}</b> crystals. Each transaction id can add crystals once; a repeated success callback (a provider's retry) is ignored.</p>
    <div class="evo-actions"><button class="btn" type="button" data-go="shop" data-sec="crystals">Done</button></div>`);
}
function mockPay(r) {
  if (!mockTx) return null;
  const status = r === 'dup' || r === 'success' ? 'success' : r === 'cancelled' ? 'cancelled' : 'failed';
  const res = Checkout.complete({ id: mockTx.id, pack: mockTx.pack, status, verified: true, mock: true });
  const why = res.ok ? 'ok' : res.why;
  mockTx.res.push(why);
  if (res.ok) { sfx.coin(); toast(`Added ${nComma(res.crystals)} crystals (development mock, nothing was charged)`); renderDungeon(); } else sfx.wrong();
  renderMockCheckout();
  return why;
}
