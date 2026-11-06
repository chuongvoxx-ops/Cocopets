# Earth ultimates — the user's spec (verbatim, 2026-11-06)

"Let's move onto Earth Ults now, I actually don't like any of the current Ults, will revamp them all."
"I want the effects and models to be very high quality, advanced and 3D, use advance shading and textures to achieve
this, I want them to be high quality like ice, fire, water, dark, light, thunder." (H = the pet's height.)

## E1. Shockwave Trampoline — original concept
Core identity: the pet repeatedly jumps and lands with exaggerated weight, sending a massive damaging shockwave across the floor on every landing.

|Property — proposed|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Jumps and landing shockwaves|3|5|7|
|Base shockwave reach|3H|3.75H|4.5H|

Pet animation: use the actual pet's existing rig or suitable whole-body transforms. Begin with a visible crouch or compression. Launch upward with a quick stretch, ease briefly near the apex, then accelerate into a heavy landing. Compress the body again on contact and allow the ears, tail or existing accessories to follow through if the rig supports it. The pet should visibly leave the ground on every jump. Avoid substituting a pulsing ground effect for the jumping animation.

Use a proposed cadence of approximately 0.75 seconds per normal jump, with a slightly longer final jump for anticipation. Preserve the casting position and use existing game rules for interruption and movement. Visual airtime should not silently grant invulnerability or change targeting rules.

Landing effects: the instant the pet touches down, produce a small, bright amber contact core, followed by a thick expanding ring of lifted stone chips. Behind the leading edge, show pale golden pressure ripples and hairline cracks briefly lighting through the ground. A low dust sheet follows the ring and settles. Keep the centre clear enough to see the pet preparing the next jump.

Each landing creates one travelling shockwave. An enemy takes one intended hit when that wave reaches it; the initial flash, debris and floor decal do not generate duplicate hits. Later waves may hit that enemy again.

At level 4, add larger wedge-shaped ground plates that lift a short distance at the moving wave front, then fall back. At Celestial, let successive impacts build a layered amber fracture pattern. Make the final jump taller, pause very briefly at its apex, then deliver the largest landing: a proposed 1.3× wider final wave, heavier rock chips and a stronger configured damage hit. Fade the fracture pattern after the final ring passes.

## E2. World Shaking — original concept
Core identity: launch one huge golden energy orb with a tilted ring. It spins as it travels, shakes the ground beneath its route and leaves a beautiful trail of dark ember-like energy.

|Property — proposed unless noted|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Main orb — preserve singular concept|1|1|1|
|Orb diameter|1.5H|1.8H|2.2H|
|Travel distance|5H|6.5H|8H|

Model and shading: give the sphere a rich yellow-gold interior with rotating mineral-like bands, brighter seams and darker amber pockets. Its ring must be a physical-looking, beveled torus with visible thickness, dark gold shaded sides and a luminous inner edge. Tilt the ring so its orbital motion is visible from the gameplay camera. Keep the orb's spherical volume readable instead of allowing bloom to flatten it into a bright circle.

Formation and launch: collect golden fragments in front of the pet. They spiral inward and become the orb's internal bands; a narrow circular streak closes into its ring. Hold for a fraction of a second, then accelerate forward along a ground-following route. The sphere spins around its own axis while its tilted ring rotates more slowly on a separate axis.

Ground response: the orb skims just above the floor. As it passes, a narrow travelling strip of ground fractures lights beneath it, small stones hop in short weighted arcs, and a faint amber pressure ripple spreads sideways. Use restrained camera tremors near the pass and stronger feedback at contact events.

Create the requested dark ember trail from charcoal-coloured flakes with glowing amber rims, thin smoky gold strands and tiny mineral sparks. The flakes lag behind the orb, tumble, lose their glow and become dust. Concentrate the brightest trail near the sphere and let older sections soften naturally.

Apply Earth damage to enemies overlapping the travelling orb on the defined contact tick. As a proposed finale, have it slow at the end of its route, tighten its ring around the core and release one radial Earth burst. Configure this finale separately from contact ticks. At level 4, expose more internal rotating bands and add a second ground ripple. At Celestial, add slow, floating mineral segments around the single main ring and a broader travelling fracture wake. The main object remains one orb at every level; the ember trail is cosmetic unless separately configured.

## E3. Cataclysm — original concept
Core identity: one enormous round boulder, threaded with glowing ember veins, falls from the sky and bounces across enemies. On its final impact it shatters into ember crystals, which also explode for additional damage.

|Property|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Boulder impacts / bounces — required|1|2|3|
|Exploding ember crystals — proposed|6|10|14|

Model: build a roughly spherical rock approximately 3H in diameter at the first level, with a dense, faceted outer crust and an uneven silhouette. Use large readable stone planes, smaller fracture details and thin branching amber veins recessed between sections. Some fissures should reveal a brighter mineral interior. Keep most of the surface dark and rough so the glowing cracks remain dramatic.

Fall and bounce: mark the first landing with a widening amber circle and small rising pebbles. Bring the rock into view high above the battlefield, then accelerate it downward. Its shadow expands and darkens as it approaches. On impact, drive a thick dust ring across the ground, flash the ember veins brighter and throw a small number of heavy chips outward.

Count the initial ground impact as bounce number one. At level 1, that is the final impact and the boulder immediately begins its shatter. At level 4, it rebounds after the first hit and shatters on the second. At Celestial, it rebounds twice and shatters on the third hit. Do not accidentally add an extra initial impact before counting the requested bounces.

For non-final impacts, use a clear ballistic rebound with a lower apex than the initial fall. Rotate the rigid rock during flight and select the next landing among valid enemy positions, following one continuous arc. If only one target remains, it may bounce back onto that area. Convey weight through speed changes, shadows and debris rather than making the stone visibly rubbery.

Final shatter: open the existing fissures, separate the shell into chunky rock pieces and expose bright amber crystals. Scatter the specified proposed number of crystals into short arcs around the final impact. Each crystal lands, glows intensely for approximately 0.6 seconds and explodes into sharp golden splinters with its own small damaging area. This secondary damage is required by the concept and must actually occur.

Each boulder landing deals its own Earth hit. Each surviving ember crystal explodes once; an enemy may take damage from multiple distinct crystal explosions if their real areas overlap. Keep ordinary shell debris cosmetic. Scale the main rock's size, crater decal and crystal richness with evolution, and make the final-impact timing obvious at every level.

## E4. Rock Steady — original concept
Core identity: heavy rocks orbit the pet, halve every incoming attack's damage throughout the skill, and immediately retaliate for 10 times each absorbed hit against every nearby valid target.

|Property|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Duration — required|15 seconds|20 seconds|25 seconds|
|Cooldown — required|120 seconds|120 seconds|120 seconds|
|Returned damage — required|10× each absorbed hit|10× each absorbed hit|10× each absorbed hit|
|Visible orbiting rocks — proposed|6|8|12|

Formation: lift thick stone slabs from a golden ground circle around the pet. Dust falls from their undersides as they rise, turn and settle into a slow orbit. Use irregular, beveled chunks with darker recessed fractures, warm mineral edges and a faint golden seam through each rock. Keep the gaps open so the pet remains visible.

Idle movement: move the rocks on two slightly tilted orbital paths, with slow independent rotation and subtle changes in height. They should feel massive and controlled. At level 4, introduce a second depth layer. At Celestial, arrange twelve rocks into three interlocking orbital bands, with large outer slabs and smaller inner stones. Thin amber strands connect nearby rocks briefly as they pass.

Absorption response: when an attack hits, the nearest rock turns toward the impact and moves a short distance to meet it. A tight golden flash runs through that stone's fissures, then through the entire orbit. The actual protection applies throughout the active duration, including through visible gaps between rocks. Do not turn the requested complete attack absorption into a finite shield that breaks after a damage budget.

Retaliation: immediately send a low golden pressure pulse from the pet through the nearby target area. Short amber fissures illuminate under each affected enemy, followed by a sharp upward spray of mineral chips. Show one clear retaliation cue per absorbed hit, with visual aggregation permitted during dense attacks while preserving every damage event.

Implement the interaction explicitly:
1. Resolve the incoming attack through the normal pre-shield defensive calculation.
2. Let A be the attack damage Rock Steady prevents before it reaches the pet's health. Absorb all of A for the active duration.
3. For each eligible creature currently inside the retaliation radius, create a retaliation hit with base Earth damage 10 × A, then use the normal outgoing target-mitigation rules. Do not divide this amount between targets.
4. For example, an absorbed 100-damage hit produces a 1,000-damage retaliation packet for each nearby valid target, before that target's own mitigation.
5. Default to nearby enemies with party damage disabled. Keep the project's friendly-fire policy configurable if "every creature" is intended literally.
6. Tag retaliatory damage so it cannot generate an infinite reflection chain. Another Rock Steady may absorb reflected damage, but should not reflect that reflected packet again.

Use a proposed retaliation radius of 3H, 3.75H and 4.5H by evolution. Retaliate per absorbed hit rather than saving everything for the end. The visual rock count does not limit how many attacks can be absorbed. Preserve the project's separate rules for status effects; full attack-damage absorption does not by itself define crowd-control immunity. Start the 120-second cooldown on activation unless the existing game explicitly defines a different cooldown convention.

At expiration, extinguish the connecting light, let the rocks descend into the floor with small dust puffs and fade the ground ring. Do not add an unrequested stored-damage explosion or leave a damaging orbit running after protection ends.

(Note: the identity line says "halve every incoming attack's damage" while the numbered rules say "absorb all of A". Brief decision: incoming attack damage is HALVED (the pet takes 50%); A = the prevented half; retaliation = 10 × A per nearby enemy. Confirmed with the user if they say otherwise.)

## E5. Crystal Coronation — new design
Core identity: enormous crowns of golden mineral crystals erupt around an enemy group in a regal, expanding formation.

|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|
|1 crown of 6 crystals|2 crowns, 12 crystals total|3 crowns, 18 crystals total|

Trace a six-pointed pattern of amber fissures across the chosen area. Pebbles tremble along the lines, then six enormous crystal spires drive upward in a circular crown. Angle their upper points slightly outward so the formation opens like a heavy mineral blossom. Each spire has a dark stone root, rich honey-coloured inner planes and pale gold edges.

Send a visible ground shockfront from the centre to the crown as it erupts. That shockfront deals one Earth hit to enemies in the crown's footprint. Use each crown as one defined area pulse; six adjacent crystal meshes should not accidentally apply six copies of the same eruption hit.

At level 4, follow the inner crown with a larger, taller outer crown approximately 0.25 seconds later. At Celestial, add a third ring with the tallest spires, creating a stepped mineral palace around the centre. Each successive crown releases a stronger configured pulse and opens a wider damage area. Keep gaps between the crystals so enemies remain visible.

Let the completed formation hold briefly while a golden highlight climbs each spire. Fine crystal dust floats upward and heavier chips fall around the roots. Then dim the interior glow and retract or crumble the spires into their ground fissures. This skill's spectacle comes from deliberate mineral growth and layered eruptions; its fading rubble is cosmetic.

## E7. Geode Arsenal — new design
Core identity: floating geodes open around the pet and launch volleys of enormous crystal spears.

|Property — proposed|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Geodes|3|5|7|
|Volleys|3|3|3|
|Spears in total|9|15|21|

Raise several rough stone spheres around the caster at staggered heights. Give them charcoal crusts, amber hairline cracks and small falling dust particles. Split each geode into four thick shell sections that open on clear hinge-like arcs, revealing a dazzling bed of honey-gold crystal points. The dark exterior and luminous interior should remain visually distinct.

A long faceted spear grows from each exposed core. Before firing, the geode leans back slightly and its shell sections tighten around the spear's base. Launch the spear with a sharp burst of golden mineral dust and a short visible recoil. Let the empty core regrow the next spear between volleys.

Aim each volley toward current valid enemy positions. Use the game's established targeting and projectile rules; give fired spears continuous trajectories and one direct damage event per intended hit. Each impact produces a compact burst of golden shards and a dark stone chip spray. Keep those decorative splinters from becoming extra unconfigured projectiles.

At level 4, arrange five geodes in a broad arc behind and beside the pet. At Celestial, use seven in a tiered formation, with pale golden filaments briefly connecting the cores before each volley. Make the third volley's spears visibly thicker with a brighter inner seam and a stronger configured hit. When all three volleys finish, the shells close, their internal light fades and the geodes settle into small showers of dust.

## E8. Gilded Quicksand — new design
Core identity: a huge patch of terrain becomes shimmering mineral sand that slows and grinds enemies, then hardens and ruptures beneath them.

|Property — proposed|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Active duration|6 seconds|8 seconds|10 seconds|
|Movement slow|40%|40%|40%|
|Field radius|3H|4H|5H|

Spread thin golden cracks through the target area, then break the surface into countless small dark grains edged with amber. Animate low rippling ridges through the field, like slow dunes of metallic sand. Use bright mineral glints sparingly, with larger dark patches between them so the surface reads as granular earth.

Around affected enemies, let shallow rings of grains slide inward and pile around their feet. Keep the bodies visible; use a subtle foot-level sinking illusion instead of hiding entire enemies beneath the floor. Apply the movement slow and periodic Earth damage while eligible enemies remain in the field. This skill does not need to pull everyone to one central point.

At level 4, add crossing dune patterns and occasional exposed amber crystal tips. At Celestial, organise the ripples into broad concentric mineral terraces, with gold veins travelling between them. The perimeter should slowly crumble inward and replenish the moving grains so the field feels alive throughout its duration.

At expiration, bring the sand's motion to an abrupt halt. Bright amber lines join across the whole field as it hardens into a mosaic of stone plates. Lift those plates a short distance, then rupture them upward in one substantial final Earth hit. Use short weighted debris arcs, a low dust veil and fading gold specks. Remove the slow as the active field ends, and keep the finale's hit event separate from the final periodic tick.

## E9. Obsidian Drill — new design
Core identity: enormous rotating drills of black stone and glowing golden crystal erupt from beneath enemies and grind through the area.

|Property — proposed|Level 1|Level 4|Level 7 — Celestial|
|---|---|---|---|
|Drills|1 large|1 large + 2 smaller|1 large + 4 smaller|
|Active drilling duration|4 seconds|5 seconds|6 seconds|

Mark the target with concentric broken amber lines and rising dust. Assemble the main drill below the surface, then thrust its pointed tip upward, followed by a thick spiralling body. Build the helix from interlocking faceted stone wedges, each with a beveled leading edge, a rough dark body and a narrow seam of golden crystal. The central drill should feel like a heavy physical mineral structure.

Rotate the helix at a speed that allows its silhouette and individual flights to remain legible. Chips kick sideways from the ground contact while fine dust rises between the moving stone sections. Thin gold highlights travel along the leading edges as they turn. Anchor the base visibly in the floor and use a dark contact shadow with a small amber grinding ring.

Apply one eruption hit as the drill emerges, followed by configured periodic contact damage during the active drilling duration. Each drill owns its own hit area. At level 4, two smaller drills erupt to either side in a slight delay. At Celestial, four smaller drills surround the main one in a diamond arrangement, their golden seams pulsing toward the centre. The primary drill remains the largest visual and damage focus.

For the finale, tighten the rotation, draw loose fragments inward, then drive all drills downward in a synchronized plunge. Release one shared radial ground rupture around the formation with a single finale hit per enemy. Let the light race through the cracks and fade beneath settling rubble. Keep the heavy stone shading visible throughout the spin; the effect should still look like a constructed drill at gameplay distance.

## Completion and review
Implement these as configurable skills using the existing project systems. Preserve the distinction between required values and proposed design defaults. Produce complete models, effects and animation sequences for the supported evolution stages, and make the level progression visible through both composition and gameplay.

Before reporting completion, preview representative casts at levels 1, 4 and 7 from the actual gameplay camera. Verify:
- Cataclysm has exactly 1/2/3 boulder impacts including the initial landing. It then produces a real, separately damaging crystal explosion phase.
- Rock Steady lasts 15/20/25 seconds, has a 120-second cooldown, absorbs incoming attack damage for its active duration and returns 10× each prevented hit to each nearby valid target. Verify one attacker, several nearby targets and a reflected-damage interaction without a loop.
- The models remain readable under glow, continuous damage is independent of frame rate, wave hits follow their visible fronts, and every skill cleans up after completion or interruption.
