const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.goto('file:///home/claude/cocopets/test-calP.html');
    await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, out = { elem: {}, star4: {}, cards: {}, dbg: [Object.keys(P.ELEM_MOVES || {}), typeof P.STAR_POOLS, typeof P.dun.CARDS] };
      for (const e in P.ELEM_MOVES) out.elem[e] = P.ELEM_MOVES[e].strong.map((row, i) => { const f = P.ELEM_IMPL[e] && P.ELEM_IMPL[e].strong[row[0]]; return { key: row[0], name: row[1], i, lv: P.ELEM_LIST[e]['ex_' + row[0]].lv, impl: !!f, src: f ? f.toString().slice(0, 400) : '' }; });
      out.elemUltCounts = {}; for (const e in P.ELEM_MOVES) out.elemUltCounts[e] = P.ELEM_MOVES[e].ult.length;
      for (const s of ['strong', 'ult']) out.star4[s] = Object.entries(P.STAR_POOLS[4][s]).map(([k, v]) => ({ key: k, name: v.name }));
      const CARDS = P.dun.CARDS; out.cards = P.dun.CARD_IDS.map(id => ({ id, slot: CARDS[id].slot, name: CARDS[id].name, el: CARDS[id].el, r: CARDS[id].r }));
      out.glm = 0; out.fg = !!(self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX);
      return out;
    });
    fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
    console.log(Object.keys(r.elem).map(e => e + ':' + r.elem[e].length + '/' + r.elem[e].filter(m => m.impl).length).join(' '), r.elemUltCounts, 'glm', r.glm, 'fg', r.fg, 'cards', r.cards.length);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
