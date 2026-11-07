# Five Dark Strongs — the user's spec (verbatim, 2026-11-07)

They replace the five remaining original Dark Strongs: Death's Pursuit → hem (Shadow Hem), Shadow Seam → hollowlantern, Night Bloom → undertow, Eclipse Mantle → ravenfold, Witch's Brand → umbralhook (keys: deathspursuit, shadowseam, nightbloom, eclipsemantle, witchsbrand).

# Five Dark Strong Attacks — Claude Implementation Prompt

Implement the following **five Dark\-element strong attacks** in my existing Cocopets game: **Death’s Pursuit, Shadow Seam, Night Bloom, Eclipse Mantle and Witch’s Brand**\. The first three focus on damage; Eclipse Mantle provides defensive utility, and Witch’s Brand combines debuff utility with delayed detonation damage\.

Inspect the project first and preserve its engine, combat controls, save data, targeting, progression and art direction\. Build and integrate all five skills into the existing strong\-attack system\. These use strong\-attack slots and cooldown rules\. Complete the implementation rather than returning another design outline\.

Prioritise beautiful materials, dimensional shading, deliberate animation and readable effects\. Use rigid, stylised geometry, repeated mesh pieces and animated ribbons where possible\. Death’s Pursuit replaces the Hellhound concept: do not attempt a running animal or a complex organic creature rig\.

Treat base as levels 1–3, the first upgrade as levels 4–6, and level 7 as Celestial\. Use the exact progression below\. Follow existing strong\-attack balance conventions for unspecified damage, cooldown, range and resource costs, and expose these values for tuning\. Do not carry over Demon Blade’s HP sacrifice or Dracula’s healing to these skills\.

## 1\. Death’s Pursuit — Homing burst attack

The pet summons floating demonic skulls that hover briefly around it, then pursue enemies along curved paths\. Each skull opens its jaw at contact and explodes into violet\-black fire and obsidian fragments\.

|Progression        |Skulls|
|-------------------|-----:|
|Base               |2     |
|Level 4            |3     |
|Level 7 — Celestial|4     |

### Model and materials

Build an intentionally stylised skull\-mask from simple rigid forms: an angular upper head, deep triangular eye sockets, a separate tapered jaw and two swept\-back horns\. Use bevelled forms and a strong silhouette\. Avoid realistic anatomy, fine teeth or soft tissue\.

Give the skull polished obsidian surfaces with varied roughness, narrow violet highlights, emissive crimson eyes and glowing cracks\. Violet fire burns inside its mouth, illuminating the jaw from within\. Keep broad surfaces dark so the geometry remains visible\.

### Animation and effects

Summon the skulls through small rotating rune rings\. They rise into a loose formation around the pet, gently bobbing and turning toward their targets\. Animate only position, rotation and a hinged lower jaw\.

Launch them in a quick stagger\. Each follows a slightly different curved path before converging on its target, with a long smoky ribbon streaming behind it\. The ribbon has a bright narrow core and soft transparent edges\.

Immediately before impact, the skull tilts forward and opens its jaw\. Close the jaw into a single bite\-and\-detonation event: a compact crimson flash, expanding violet flame and spinning dark fragments that dissolve into smoke\.

At Celestial, enrich the horn accents and briefly connect the four skulls with faint rune threads during summoning\. These threads are decorative\.

### Gameplay

Prioritise separate nearby enemies, but allow every skull to converge on a lone target\. Reacquire a valid nearby target if its original target dies; otherwise dissipate after a short bounded lifetime\.

Each skull resolves one damage event on impact, with a small configurable splash radius\. The primary target must not receive separate bite and explosion hits from the same skull\. Different skulls may each damage the same enemy\.

## 2\. Shadow Seam — Piercing ranged attack

The pet tears a narrow violet seam through the air and launches successive razor\-thin crescents of darkness down a targeted corridor\. Their changing orientations create an elegant crossing pattern\.

|Progression        |Crescents|
|-------------------|--------:|
|Base               |3        |
|Level 4            |5        |
|Level 7 — Celestial|7        |

### Casting and projectile design

Use the pet’s existing gesture animation to open a jagged seam in front of it\. Keep the interior almost black, bordered by fine violet\-white light and drifting crimson sparks\.

Fire crescents in a rapid, readable sequence\. Alternate their planes between diagonal left, diagonal right and near\-horizontal while keeping their travel directed down the same attack corridor\.

Give each crescent a thin curved mesh with a sharp luminous outer edge, a smoky indigo body and an opacity gradient fading toward its inner edge\. Add subtle moving texture inside the shape\. The crescent must have visible curvature and depth rather than resembling a flat solid disc\.

### Impact and progression

As a crescent passes through an enemy, show a brief luminous cut and a small spray of dark crystalline sparks\. Leave suspended violet fractures along the path; these close and dissolve shortly afterward\.

At Celestial, make the final crescent visually broader and give its closing fracture a more intricate rune pattern\. Keep its actual hitbox consistent with its visible size and configurable reach\.

### Gameplay

Every crescent pierces valid enemies along its path, damaging each enemy once per projectile\. Later crescents may hit those enemies again\. Use swept collision or the engine’s equivalent\.

The lingering fractures are decorative and must not cause extra damage\. Respect the game’s normal obstacle and line\-of\-sight rules\.

## 3\. Night Bloom — Delayed area attack

The pet plants a luminous black seed beneath a targeted group\. Angular thorned stems spiral upward and support a large midnight flower\. Its translucent petals fold inward, gather crimson light and burst outward in a single explosion\.

|Progression        |Flowers                                                |
|-------------------|-------------------------------------------------------|
|Base               |1 large central flower                                 |
|Level 4            |Central flower, followed by 2 smaller satellite flowers|
|Level 7 — Celestial|Central flower, followed by 4 smaller satellite flowers|

### Construction and visual growth

Build the flower from repeated tapered petal meshes, simple curved stems and faceted crystal thorns\. Animate petal rotation, scale and position; do not depend on complex soft\-body simulation\.

The seed falls into a small dark ripple\. Stems rise in a controlled spiral while petals unfold in staggered layers\. Use deep purple outer surfaces, translucent violet edges and thin crimson veins that brighten toward the centre\.

The flower should feel beautiful and uncanny: a dark crystal lotus with a pulsing red core\. Illuminate the undersides of the petals from that core, with restrained bloom and textured surface variation\.

### Detonation sequence

Show a readable ground indicator and a brief growth delay before the central flower detonates\. Its petals curl inward, the core contracts, and the flower bursts into outward\-flying petal shards and a low smoky shockwave\.

At level 4, place two satellite blooms on opposite sides of the central point\. At Celestial, place four around it\. After the central explosion, make the satellites bloom and detonate in a quick sequential pattern, with their positions and damaging areas visible beforehand\.

Use soft fading petals and drifting embers for the aftermath\. All temporary geometry must dissolve promptly\.

### Gameplay

Lock the cast’s target point when planting the seed\. Each flower deals one area\-damage event at its own detonation; growth, stems and lingering particles deal none\.

Satellite blooms are smaller, separately tunable damage sources\. Their areas may overlap, but each enemy can be hit only once per flower\. Use valid ground positions and avoid spawning satellite flowers through walls or outside playable terrain\.

## 4\. Eclipse Mantle — Party defence utility

The pet unfurls a veil of darkness that separates into protective mantles around itself and nearby allies\.

|Progression        |Shield per recipient              |Duration |
|-------------------|---------------------------------:|--------:|
|Base               |10% of that recipient’s maximum HP|6 seconds|
|Level 4            |14% of that recipient’s maximum HP|7 seconds|
|Level 7 — Celestial|18% of that recipient’s maximum HP|8 seconds|

### Casting and shield appearance

A small eclipsed moon forms above the pet: a dark sphere edged by a narrow silver\-violet corona\. A circular pulse travels across the ground, clearly showing which allies receive protection\.

Around each recipient, form a few curved translucent ribbons that suggest a flowing cloak\. Use animated mesh deformation or scrolling textures rather than a full cloth simulation\.

The mantle has a smoky interior, fine silver\-violet edges and slowly orbiting crescent fragments\. Keep it transparent enough to read the protected character and its animations\.

### Damage feedback and progression

When the shield absorbs damage, ripple its surface outward from the impact point\. As its remaining capacity falls, spread luminous cracks across the mantle\. When depleted, it breaks into black feather\-like fragments and fading silver sparks\. Natural expiration dissolves it gently\.

At Celestial, add a second thin orbital ring and a richer corona while preserving visibility\.

### Gameplay

Apply the shield once to eligible allies within range at cast time, including the caster\. It follows each recipient for its remaining duration; this is not a persistent ground aura\.

Calculate shield strength from each recipient’s own maximum HP\. Use the existing shield system for absorption and damage ordering\.

Instances of Eclipse Mantle never add together\. On reapplication, retain the greater of the existing remaining shield and the newly granted amount, and refresh to at least the new expiration time\. Keep interactions with other shield types consistent with the game\.

This skill deals no damage and grants no healing\.

## 5\. Witch’s Brand — Area debuff and delayed detonation

The pet creates a rotating demonic seal above a targeted area\. Dark threads descend onto enemies, marking them with glowing violet brands that reduce defence and movement speed\. Each brand detonates on its bearer when its debuff naturally expires, dealing a single burst of Dark damage\.

|Progression        |Defence reduction|Movement slow|Duration |
|-------------------|----------------:|------------:|--------:|
|Base               |15%              |20%          |6 seconds|
|Level 4            |20%              |25%          |7 seconds|
|Level 7 — Celestial|25%              |30%          |8 seconds|

### Seal and application

Construct the seal from layered rings, angular glyphs and a central diamond\. Rotate its layers slowly in opposing directions\. Give them thin violet luminous edges and darker textured interiors\.

The pet gestures upward; the seal unfolds horizontally above the target area\. Show its footprint clearly on the ground\. Dark threads descend from the glyphs and connect briefly to enemies within that footprint\.

On application, a violet brand flashes onto each affected enemy\. Place it on a suitable attachment point or as a floating emblem when the enemy model does not support a surface mark\.

### Persistent visual feedback

Broken rune arcs orbit branded enemies\. Short smoky strands trail from them as they move, communicating the slow without covering their bodies\.

At Celestial, the seal briefly opens like a spectral eye: layered rigid shapes separate around a glowing central slit, then fold shut\. Use simple geometry and emissive materials rather than an organic eyeball model\.

During the final second of the debuff, accelerate the orbiting rune arcs and intensify the crimson light inside the brand\. The threads draw inward, the mark briefly contracts, then ruptures into a compact violet\-black explosion with a bright crimson centre, shattered rune fragments and a fading circular pressure ripple\. Synchronise the damage with the rupture at natural expiry\. At Celestial, let a spectral eye flash within the mark immediately before it breaks\. Keep the explosion focused on the branded enemy; the outward ripple is decorative\. Cleansed marks fade without exploding\.

### Gameplay

Apply both debuffs once to enemies in the area when the seal activates\. Use the existing defence\-stat and status\-effect systems; apply percentage reductions through stat modifiers rather than permanently editing base stats\.

Bosses follow existing slow resistance and immunity rules\. Resolve defence reduction and movement slow independently so immunity to one does not automatically cancel the other\.

Repeated Witch’s Brand casts do not stack reductions or create multiple pending explosions on the same target\. Keep the strongest active value for each modifier and refresh the shared brand expiry through the existing status rules\. Refreshing postpones the single detonation to the new expiry; it does not trigger the old timer\. Remove all modifiers correctly on expiration, cleansing or death\.

### Detonation rules

Deal no damage on application or during the debuff\. At natural expiry after 6/7/8 seconds respectively, deal one burst of Dark damage to the branded enemy\. Use the existing strong\-attack damage formula and level scaling, with a configurable detonation coefficient\. This is fixed skill damage, not stored damage taken during the curse\.

Resolve the expiry damage immediately before removing the brand’s defence modifier, so its final burst benefits from the defence reduction where that stat applies\. Use a unique status instance and an atomic detonation flag to prevent duplicate damage from expiry callbacks, refreshes or effect cleanup\.

Default to damage only on the branded target, with no splash or chain reaction\. Every marked living enemy detonates independently\. Cleansing, target death, despawning or encounter reset cancels the pending explosion\. Slow immunity alone does not cancel the mark’s timer or damage; respect any full\-mark immunity defined by the existing status system\.

## Shared quality and verification requirements

Give each skill distinct sound cues: hollow jaw clicks and a flame burst for Death’s Pursuit; sharp airy cuts for Shadow Seam; crystalline unfolding and a deep bloom burst for Night Bloom; a soft resonant pulse for Eclipse Mantle; and a low whispering chime followed by a rising curse pulse and sharp detonation for Witch’s Brand\.

Use local lighting, material highlights, restrained bloom and depth\-aware particles to create dimensional effects\. Keep enemies, attack telegraphs and UI readable\. Preserve the renderer and provide lightweight equivalents for unsupported effects\. Pool temporary objects and cap lights and particles when several pets cast simultaneously\.

Integrate all five into selection, equipment, progression and tooltips\. Show exact counts, shield percentages, debuff percentages and durations at each tier\. Witch’s Brand’s tooltip must also state that the mark explodes for Dark damage when it naturally expires\. Do not impose an ultimate\-only rarity restriction\.

Verify the 2/3/4 skulls, 3/5/7 crescents and 1/3/5 total flowers\. Check single and multiple targets, misses, retargeting, interruption and cleanup\. Verify shield depletion and refresh, debuff expiry and cleanse, and boss resistance\. Eclipse Mantle must cause no damage\. Verify exactly one Witch’s Brand detonation per marked target at natural expiry, no application damage, no detonation on cleanse or target death, no old\-timer detonation after refresh, and correct damage ordering before defence\-modifier removal\.

Define cast commitment using the existing combat rules: interruption before release cancels pending effects; already released projectiles or applied statuses follow the game’s established lifetime rules\. Cancel unreleased spawns and clean up orphaned visuals\.

Finish all five skills, run the project’s relevant checks, and report the implementation changes and any remaining limitations\.