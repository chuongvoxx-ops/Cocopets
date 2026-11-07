# Dark Strong: Demon Blade — the user's spec (verbatim, 2026-11-07)

Row: key `demonblade` replaces Dark Strong `double` (Midnight Double), cost 28, cd 6, glyph 'crescent'.
Note: no Demon Blade existed before; the "existing" health-sacrifice and nonlethal rule are new here — implement: 2% of max HP per connecting swing, once per swing, never lowering HP below 1 (nonlethal).

Implement Demon Blade as a visually elaborate Dark-element strong attack for my existing Cocopets game. The pet summons a gigantic sword forged from darkness and performs a powerful, flowing melee combo.

Inspect the existing project first and integrate with its combat, animation, targeting and strong-attack systems. Preserve the established art direction while delivering exceptionally detailed shading, textures, three-dimensional effects and expressive animation.

Combo progression

Attack level	Combo length
Base	3 swings
Level 4	5 swings
Level 7 — Celestial	7 swings

Each swing deals substantial Dark damage. Retain the health-sacrifice mechanic: a connecting swing costs 2% of the attacking pet’s maximum HP, charged once regardless of how many enemies it hits. Misses cost nothing. Preserve the existing nonlethal cost rule.

Summoning the sword

A thin violet seam opens beside the pet. Black crystal fragments emerge and assemble into an enormous greatsword, forming progressively from the hilt to the tip. Crimson inscriptions illuminate as each section locks into place.

Make the sword approximately 2.5–3 times the pet’s height, with a thick tapered blade, bevelled edges, a raised central ridge, a sculpted demonic guard and a detailed grip. Adapt its grip or magical tether to the pet’s anatomy.

Use polished obsidian and dark metallic materials, with fine scratches, subtle roughness variation and engraved channels. Violet highlights should reveal the blade’s thickness, while recessed crimson runes pulse beneath its surface. Keep the centre dark and textured.

The pet braces against the weapon’s weight before beginning the combo.

Distinct, connected attack choreography

Build the combo from these movements:

1. Opening cleave: A broad left-to-right horizontal slash.
2. Returning cut: A diagonal slash from high right to low left.
3. Rising slash: A powerful upward cut from near the ground.
4. Reverse cleave: A horizontal return swing driven by a full body turn.
5. Turning sweep: One deliberate pivot carries the blade around the pet in a low circular arc.
6. Descending diagonal: A steep shoulder-driven slash that flows into the final wind-up.
7. Overhead finisher: The pet raises the sword and delivers a crushing downward strike.

Use these exact combinations:

* Base: Opening cleave → returning cut → overhead finisher.
* Level 4: Opening cleave → returning cut → rising slash → reverse cleave → overhead finisher.
* Celestial: All seven movements.

The overhead finisher is always the final counted swing.

Animate anticipation, acceleration and follow-through. Show the pet shifting its weight, turning its body and adjusting its grip. Each movement should naturally prepare the next, giving the combo a carefully choreographed rhythm.

Beautiful layered sword trails

Generate curved ribbon trails from the blade’s actual movement through three-dimensional space.

Across each trail’s width, create:

* A narrow, sharply defined violet-white cutting edge.
* A translucent indigo middle with subtle flowing texture.
* A gradual opacity fade toward the inner edge.
* Wisps of black smoke separating from the oldest sections.

Fade the trail along its length as well. Fast swings produce wider crescents; slow preparation produces only a thin smoky wake.

Allow consecutive arcs to overlap briefly, creating elegant intersecting shapes around the pet. Add a restrained crimson filament and scattered obsidian fragments, while keeping the sword and enemies visible.

Impact, lighting and texture

At contact, synchronise a compact violet-white flash, angular dark sparks and a brief pressure ripple. Let the impact illuminate nearby enemy surfaces and the ground.

Use moving shadows, controlled bloom, soft smoke intersections and material highlights to give the effects depth. Prioritise convincing geometry, lighting and animation over excessive particles.

Pair each swing with a deep cutting sound and each hit with a short bass impact. Apply restrained hit-stop and camera shake, respecting accessibility settings.

When health is sacrificed, draw a thin crimson thread from the pet into the hilt and pulse the sword’s inscriptions.

The finishing strike

During the final wind-up, nearby smoke draws toward the raised sword. Crimson runes brighten sequentially from hilt to tip.

The downward strike releases a directional eruption of darkness and opens a temporary jagged violet-crimson fissure across the ground. Small spectral fragments rise around the impact and dissolve into embers.

These effects belong to the final swing and must not generate additional hits.

Celestial presentation

At level 7, give the sword a more elaborate demonic guard, brighter recessed inscriptions and a few floating blade fragments that follow its movements.

During the final wind-up, a faint horned shadow briefly appears behind the pet and mirrors its finishing strike. Keep it translucent and short-lived so the pet remains the focus.

After the combo, the sword disintegrates from tip to hilt into drifting black crystal fragments.

Implementation requirements

Use the existing strong-attack damage and cooldown conventions. Each enemy can be damaged once per swing; trails and particles must not create duplicate hits or health costs.

Keep targeting responsive between swings. Handle interruption, target death and missed attacks correctly, cleaning up the weapon and effects when the sequence ends.

Use rendering techniques supported by the existing engine, with scalable particles and lighting for performance. Verify exactly 3, 5 and 7 swings at the appropriate levels.

The result should feel like a pet wielding a magnificent cursed greatsword: weighty movement, intricate materials, sweeping translucent arcs and a spectacular finishing blow.