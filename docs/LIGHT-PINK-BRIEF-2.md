# Pink Light Ultimates — round 2 (four more of the user's designs)

Read `docs/LIGHT-PINK-BRIEF.md` first: the house standard, the pink palette, the art direction ("design manifesto"), the
toolkit, damage totals, levels (C.evo 1..7, Celestial 7) and the checking procedure all apply unchanged. Study the shipped
pink ults for style and reusable pieces (copy, don't modify): `20k4b-light-ult-1.js` (Rainbow Heart Attack, Holy Judgement:
cached thick heart sprites, the `bits()` heart/star particle helper), `20k4c-light-ult-2.js` (Sunflare),
`20k4d-light-ult-3.js` (Ray of Light: beam column layers, solid core, feathered foot, pet-dimming).
Lessons from the user's feedback on those: no hard edges anywhere (feather every layer's ends and the foot of any beam);
give beams a solid opaque pearl core under the additive glow (pure additive looks see-through); never cut a box out of
an effect around the pet (dim the whole thing smoothly instead); no flat sprite-flame clutter; smooth, alive motion.

The ELEM_MOVES rows are already set in `src/js/20k1-elem-core.js` (don't edit them except your own row's description if it
is wrong): crescentbeam replaced guilloche, meteorshower replaced mirrors, salvation replaced solarengine, ribbonheartache
replaced verdict. In your file delete the old one(s): `delete U.guilloche;` etc.
File wrapper:
```js
/* ---------- Light (pink), reworked: <moves> ---------- */
(() => { const U = ELEM_IMPL.light.ult; delete U.<old>; U.<key> = (C, H) => { ... }; })();
```

## 2. Crescent Beam (crescentbeam)
A luminous pink crescent appears just ahead of the pet. Tiny stars gather between its tips as thin strings of light pull
toward its centre. A narrow initial line establishes the firing direction, then expands into a massive straight beam with a
pearl-white centre, saturated pink body, and soft rose halo. Bright streaks flow rapidly forward through it, making the beam
feel continuously powered. The crescent remains visible at its source, slowly turning during the channel. Fine light
strands spiral around the beam's surface, while little hearts and stars stream from its outer edges. Enemy contacts produce
concentrated pink flashes and outward-scattering glints.
At Celestial, three nested crescent arcs frame the firing point, rotating at different speeds. The beam becomes broader and
more richly layered while remaining straight. It stays active for seven seconds, then narrows at the source as its
remaining light streams forward and fades.
(Notes: fires along the aim C.a from the cast point; the source stays where cast. Lower levels channel shorter, e.g. ~4 s
at level 1, ~5.5 s at Adept, 7 s Celestial; width grows with level. Damage ticks to everything inside the beam; total for a
monster inside the whole time ≈ the house total. Never cover the pet: the beam starts ahead of it.)

## 3. Meteor Shower (meteorshower)
A field of small pink lights gathers high above the enemies. The lights stretch into luminous droplets and begin falling,
each carrying a bright pearl core and a long tapered pink trail. The shower starts with separated streaks before building
into a dense, glittering rain of light. Slightly different descent angles and trail lengths create depth across the
battlefield. Every impact produces a brief pink light pool, a small expanding ring, and a burst of five-pointed stars. Tiny
hearts float upward from selected impacts, contrasting beautifully with the falling lights.
As the skill evolves, the shower covers a broader area and becomes more layered.
At Celestial, overlapping waves of long pink-white streaks rain through a field of suspended star glints. The final
sequence sweeps across the target area in rapid succession, leaving the ground shimmering with fading pink impact light.
(Notes: centred on the aim/monster group; meteors bias toward monsters; counts and area grow with level; ~4–5 s.)

## 4. Salvation (salvation)
A luminous heart forms beneath the pet. Thin pink ribbons rise from its perimeter and curve outward toward every teammate.
The centre fills with pearl-white light before releasing a broad, gentle pink pulse. At that moment, every living teammate
is restored to full HP, and every fallen teammate is revived at full HP.
Living allies receive a soft heart halo and rising stars. At each fallen ally's revival position, a brighter heart outline
appears beneath a short column of pink light. Their existing revival animation plays as sparkling particles rise around
them. The complete party heal and revive work at every level, including level 1.
Higher levels make the rescue more elaborate. At Celestial, a grand five-pointed seal appears beneath the central heart.
Seven delicate light rings expand outward as broad ribbons connect the party. Each revival produces rising heart outlines
and spiralling pearl-white stars, ending in a gentle shower of pink motes.
(Notes: "teammates" = the player's party pets (the team bar, TAP ME TO SWITCH; benched/fallen party members) and any
active summon/companion — find how the game stores the party, its HP, death and revive (grep for revive/fainted/team/
party/switch), and reuse the game's own revive path and animation. The caster pet is healed too. No damage.)

## 5. Ribbon Rainbow Heartache (ribbonheartache)
Enormous ribbons of luminous pink light unfold and sweep through enemies in a graceful, coordinated dance. Each ribbon has
a pearl-pink upper surface, a richer rose underside, and a narrow glowing edge. Its tapered tail follows its movement with
a slight delay, giving it the flowing appearance of luminous satin. The ribbons alternate between low sweeping passes and
tall looping arcs. Their leading edges brighten during attacks, scattering stars and broken love hearts at enemy contact.
Fine light strings trace their paths, while occasional heart particles drift away.
Two ribbons form the initial version. Four create layered figure-eight paths at level 4.
At Celestial, six ribbons form three coordinated pairs, opening into wide loops and crossing at different heights. Their
twisting surfaces catch alternating rose and pearl highlights. At the finish, they gather briefly into three oversized
bow-like arrangements, then loosen into floating strings and stars.
(Notes: counts by level 1..7: 2,2,3,4,4,5,6 or similar; ~5–6 s; ribbons are 3D-ish satin strips (two-tone by which face
shows: compute the strip's normal/twist and colour top vs underside), feathered tail, per-target hit interval.)
