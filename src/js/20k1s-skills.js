/* ---------- v391 K: a pet's own Strong and Ultimate (its skills) ----------
   Pets do not learn skills. A pet's Strong and Ult are rolled once, from its seed, from its star tier's pool, and saved
   on the pet (p.skills). Fusion is the only way to change them (07c-fusion.js: inherit a parent's, or roll one). The
   ability cards are a separate system and stay as they were: a card equipped in a slot still replaces the skill there.
   The pools (skillPool):
     1★–4★  every move that is not elemental: the innate kit (STRONGS / SPECIALS, 02c-ability.js) and the star pools
            STAR4, STAR5 and STAR6 (the golden moves; 20k-dun-star.js). Throne of the Sun is never given to an earth,
            wind or dark pet (STAR_NO_SUN). Card-only moves are not in any pool.
     5★     the pet's own element's moves that are NOT on its six-star list (ELEM_MOVES minus ELEM_SIX, 20k1-elem-core.js)
     6★     the pet's own element's six-star list, ELEM_SIX (exclusive to six-stars)
   A pet's tier is its star rank, starsOf(p.rarity): fixed at birth (or by fusion), as shown on its card.
   Move ids (the developer setting also puts them in the deck): 's:<key>' innate Strong, 'u:<key>' innate Ult,
   'x4:<key>' / 'y4:<key>' (and 5, 6) a star pool's Strong / Ult, 'e:<element>:<key>' an elemental move.
   petSkills(p) -> { strong: { id, src, of? }, ult: { id, src, of? } }; src is 'roll' (born with it), 'parent' (inherited
   in fusion from the pet named in of) or 'fuse-roll' (rolled in fusion). Everything that shows or fights with a pet's
   Strong or Ult goes through it (innateAbility in 02d-cards.js).
   "Unlock all skills (dev)" (st.devMoves, in Developer tools) brings back a free pick: any pet may equip any move of any
   pool from the Ability cards screen. Off by default; the pet's own skills come back the moment it is off. */
const SKILL_SLOTS = ['strong', 'ult'];
const SKILL_STAR_TIERS = [4, 5, 6];
const devSkillsOn = () => !!(typeof st !== 'undefined' && st && st.devMoves);
const skillTier = p => { if (!p) return 3; const r = typeof p.rarity === 'number' ? p.rarity : rarityOf(formOf(p)); return starsOf(r); };
const skillSlotOf = id => typeof id !== 'string' ? null : /^s:/.test(id) || /^x[456]:/.test(id) ? 'strong' : /^u:/.test(id) || /^y[456]:/.test(id) ? 'ult' : (() => { const mv = typeof elemParse === 'function' ? elemParse(id) : null; return mv ? mv.slot : null; })();
/* the move an id names: { kind, slot, key, tier (star pools), el (elemental), raw (its data row) }, or null */
function skillParse(id) {
  if (typeof id !== 'string') return null;
  let m = /^([su]):([a-z0-9]+)$/.exec(id);
  if (m) { const strong = m[1] === 's', raw = strong ? (STRONGS[m[2]] && INNATE_STRONG[m[2]] ? STRONGS[m[2]] : null) : (SPECIALS[m[2]] && INNATE_ULT[m[2]] ? INNATE_ULT[m[2]] : null); return raw ? { id, kind: 'innate', slot: strong ? 'strong' : 'ult', key: m[2], raw } : null; }
  m = /^([xy])([456]):([a-z0-9]+)$/.exec(id);
  if (m) { const slot = m[1] === 'x' ? 'strong' : 'ult', tier = +m[2], P = STAR_POOLS[tier], raw = P && P[slot][m[3]]; return raw ? { id, kind: 'star', slot, tier, key: m[3], raw } : null; }
  if (id.slice(0, 2) === 'e:') { const mv = elemParse(id); if (!mv) return null; return { id: elemId(mv.el, mv.key), kind: 'elem', slot: mv.slot, el: mv.el, key: mv.key, raw: mv }; }
  return null;
}
const isSkillId = id => !!skillParse(id);
/* the pool a pet of this tier and element rolls from, for one slot: an array of ids (memoised) */
const SKILL_POOLS = new Map();
function skillPool(tier, e8, slot) {
  tier = clamp(Math.round(tier || 3), 1, 6); if (!E8[e8]) e8 = 'thunder'; slot = slot === 'ult' ? 'ult' : 'strong';
  const k = (tier <= 4 ? 'low' : tier) + '|' + e8 + '|' + slot; let out = SKILL_POOLS.get(k); if (out) return out;
  if (tier <= 4) {
    out = Object.keys(slot === 'strong' ? STRONGS : SPECIALS).filter(x => (slot === 'strong' ? INNATE_STRONG : INNATE_ULT)[x]).map(x => (slot === 'strong' ? 's:' : 'u:') + x);
    SKILL_STAR_TIERS.forEach(t => Object.keys(STAR_POOLS[t][slot]).forEach(x => { if (slot === 'ult' && x === 'sunthrone' && STAR_NO_SUN.has(e8)) return; out.push((slot === 'strong' ? 'x' : 'y') + t + ':' + x); }));
  } else {
    const six = (ELEM_SIX[e8] && ELEM_SIX[e8][slot]) || [], all = ((ELEM_MOVES[e8] || {})[slot] || []).map(r => r[0]);
    out = (tier >= 6 ? six.filter(x => all.includes(x)) : all.filter(x => !six.includes(x))).map(x => elemId(e8, x));
  }
  SKILL_POOLS.set(k, out); return out;
}
const skillInPool = (id, tier, e8, slot) => skillPool(tier, e8, slot).includes(id);
/* why a move cannot be a pet's at this tier and element ('' when it can), in a few words for the fusion screen */
function skillWhyNot(id, tier, e8, slot) {
  const m = skillParse(id); if (!m) return 'unknown move';
  if (m.slot !== slot) return slot === 'ult' ? 'not an Ultimate' : 'not a Strong attack';
  if (skillInPool(m.id, tier, e8, slot)) return '';
  if (tier <= 4) return m.kind === 'elem' ? `not available at ${tier}★` : m.key === 'sunthrone' ? `not for ${E8[e8].name} pets` : `not available at ${tier}★`;
  if (m.kind !== 'elem') return `not available at ${tier}★`;
  if (m.el !== e8) return `${E8[m.el].name} move: the child is ${E8[e8].name}`;
  return tier >= 6 ? 'not available at 6★' : '6★ only: not available at 5★';
}
/* one roll from a pool */
function rollSkillId(tier, e8, slot, R) { const P = skillPool(tier, e8, slot); return P.length ? P[Math.floor(R() * P.length) % P.length] : null; }
/* the skills a pet is born with: its seed, its tier, its element. Deterministic */
function rollSkills(p) {
  const tier = skillTier(p), e8 = petElement(p), seed = (p && p.dna && p.dna.seed) || 1;
  const R = mulberry32((Math.imul(seed | 0, 2654435761 | 0) ^ 0x5C1115) >>> 0);
  return { strong: { id: rollSkillId(tier, e8, 'strong', R), src: 'roll' }, ult: { id: rollSkillId(tier, e8, 'ult', R), src: 'roll' } };
}
/* a saved p.skills, checked: only moves that exist, in the right slot */
function cleanSkills(o) {
  if (!o || typeof o !== 'object') return null;
  const out = {};
  for (const s of SKILL_SLOTS) { const v = o[s]; if (!v || typeof v !== 'object') return null; const m = skillParse(v.id); if (!m || m.slot !== s) return null; out[s] = { id: m.id, src: ['roll', 'parent', 'fuse-roll'].includes(v.src) ? v.src : 'roll' }; if (typeof v.of === 'string') out[s].of = v.of.replace(/[<>]/g, '').slice(0, 14); }
  return out;
}
/* THE function: a pet's own Strong and Ult (what it was born with, or given by fusion) */
function petSkills(p) {
  const sk = p && p.skills;
  if (sk && sk.strong && sk.ult && skillParse(sk.strong.id) && skillParse(sk.ult.id)) return sk;
  return rollSkills(p);
}
/* a move as a kit ability for the Tower (the shapes innateAbility always made) */
function skillAbility(id, slot, p, AB, o) {
  const m = skillParse(id); if (!m) return null;
  o = o || {}; slot = slot || m.slot;
  AB = AB || petAbility(formOf(p), p.dna.seed);
  const E = ELEMENTS[AB.el] || ELEMENTS.spark, grow = 1 + 0.05 * ((p.stage || 1) - 1), tag = { id: m.id, skill: true, dev: !!o.dev, src: o.src || null, of: o.of || null };
  if (m.kind === 'elem') {
    const a = Object.assign(elemAbility(m.raw, slot, p), { sig: true }, tag);
    if (m.slot === 'ult') a.star = Math.max(a.star || 0, o.dev ? ELEM_ULT_STARS : skillTier(p));   // (a pet that has an elemental Ult may cast it)
    return a;
  }
  if (m.kind === 'star') { const S = m.raw, t = m.tier; return Object.assign({ slot, own: true, star: t, key: (m.slot === 'ult' ? 'y_' : 'x_') + m.key, name: S.name, glyph: S.glyph, el: AB.el, mult: grow * (t >= 6 ? 1.5 : t >= 5 ? 1.25 : 1.1), cost: S.cost, cd: S.cd, desc: S.desc }, tag); }
  if (m.slot === 'strong') { const k = m.key, S = INNATE_STRONG[k]; return Object.assign({ slot, own: true, key: 's_' + k, name: k === 'spikes' ? espikeName(AB.el) : `${E.name} ${STRONGS[k].name}`, glyph: S.glyph, el: AB.el, mult: grow, cost: S.cost, cd: S.cd, desc: k === 'spikes' ? espikeDesc(AB.el) : STRONGS[k].desc }, tag); }
  const U = INNATE_ULT[m.key];
  return Object.assign({ slot, own: true, key: 'u_' + m.key, name: `${E.name} ${U.name}`, glyph: U.glyph, el: AB.el, mult: grow, cost: U.cost, cd: U.cd, desc: U.desc }, tag);
}
/* the pet's own skill in a slot, as a kit ability */
function ownSkillAbility(slot, AB, p) { const S = petSkills(p)[slot]; return S ? skillAbility(S.id, slot, p, AB, { src: S.src, of: S.of }) : null; }
/* where a skill came from, in words */
function skillSrcText(S, p) {
  if (!S) return '';
  const m = skillParse(S.id), t = skillTier(p), pool = t <= 4 ? '1–4★ pool' : `${E8[petElement(p)].name} ${t}★ list`;
  if (S.src === 'parent') return `Inherited from ${S.of || 'a parent'} in fusion`;
  if (S.src === 'fuse-roll') return `Rolled in fusion · ${pool}`;
  return `Born with it · ${pool}${m && m.kind === 'star' ? ` · ${m.tier}★ star move` : ''}`;
}
/* every move of one slot, grouped by pool: the developer's free pick */
function skillGroups(slot) {
  const pre = slot === 'ult' ? 'y' : 'x', out = [{ name: 'Innate kit (1–4★)', ids: Object.keys(slot === 'ult' ? INNATE_ULT : INNATE_STRONG).filter(k => (slot === 'ult' ? SPECIALS : STRONGS)[k]).map(k => (slot === 'ult' ? 'u:' : 's:') + k) }];
  SKILL_STAR_TIERS.forEach(t => out.push({ name: `${t}★ star pool${t === 6 ? ' (golden)' : ''} (1–4★)`, ids: Object.keys(STAR_POOLS[t][slot]).map(k => pre + t + ':' + k) }));
  E8_ORDER.forEach(e => { [5, 6].forEach(t => out.push({ name: `${E8[e].name} ${t}★`, el: e, ids: skillPool(t, e, slot) })); });
  return out;
}
/* (v391 K) the read-only panel: a pet's own Strong and Ult, with where they came from. o.dev: say a dev pick is on */
function skillsBoxHTML(p, AB, o) {
  o = o || {};
  const t = skillTier(p), sk = petSkills(p);
  const row = s => { const a = ownSkillAbility(s, AB, p); if (!a) return ''; const E = ELEMENTS[a.el] || ELEMENTS.spark;
    return `<div class="sk-own"><span class="fab-art" style="--ec:${E.color}">${glyphSVG(a.glyph)}</span><div class="sk-own-copy"><small>${s === 'ult' ? 'Ultimate' : 'Strong attack'}${a.e8 ? ` · ${E8[a.e8].name}` : a.star ? ` · ${a.star}★ move` : ''}</small><b>${esc(a.name)}</b><span>${esc(a.desc)}</span><em>${esc(skillSrcText(sk[s], p))}${a.cost ? ` · ${a.cost} MP · ${a.cd.toFixed(1)}s` : ''}</em></div></div>`; };
  return `<div class="sk-box" data-k="skills"><p class="eyebrow">${esc(p.name)}'s own skills · ${t}★</p>${row('strong')}${row('ult')}<p class="note">Pets don't learn skills: these were rolled when ${esc(p.name)} was born, from the ${t <= 4 ? '1–4★ pool' : `${E8[petElement(p)].name} ${t}★ list`}. Fusion is the only way to change them. Ability cards can still be equipped over them.${o.dev ? ' <b>Developer pick is on:</b> any move below can be equipped.' : ''}</p></div>`;
}
/* the saved-game step (04-state.js sanitize): once (st.skillsV), every pet is rolled again under these rules and
   loses any elemental move it had equipped (its ability cards stay); after that, saved skills are kept */
function migrateSkills(s, o) {
  const pets = [s].concat(s.others || []), first = !(o && o.skillsV >= SKILLS_V);
  pets.forEach(p => {
    const saved = first ? null : cleanSkills(p.skills);   // (sanitizePet carried each pet's saved skills over)
    p.skills = saved || rollSkills(p);
    if (first) { if (p.abOv) { delete p.abOv.strong; delete p.abOv.ult; if (!Object.keys(p.abOv).length) p.abOv = null; } if (p.deck) SLOTS.forEach(k => { if (p.deck[k] && !CARDS[p.deck[k]]) p.deck[k] = null; }); }
  });
  s.skillsV = SKILLS_V;
}
/* (test hook: build.py exposes this as __pp.skillsK) */
const SKILLS_K = { petSkills, rollSkills, skillPool, skillParse, skillWhyNot, skillTier, skillAbility, skillGroups, cleanSkills, isSkillId, devSkillsOn, migrateSkills, ELEM_SIX, get SKILLS_V() { return SKILLS_V; },
  fuseSkillsFor, fuseSkillChoices, fuseAllSkills, fuseAllAb, get fuseAllSel() { return fuseAllSel; }, renderCards, get cardsSlot() { return cardsSlot; } };   // (v391 K, build.py: __pp.skillsK)
