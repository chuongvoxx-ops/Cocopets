# Wind ultimate: Pandemonium — the user's spec (verbatim, 2026-11-07)

Row: key `pandemonium` replaces Wind `loom` (Loom of the Heavens), cost 100, cd 75, glyph 'vortex'.

Create Pandemonium, the supreme offensive Wind ultimate for my Cocopets game.

The pet summons one enormous swirling windstorm that pulls enemies into the air and gathers them at one central point. The storm continuously damages its captives and amplifies all other allied attacks against them by 1.4×, before ending in a massive Wind explosion.

Property	Level 1	Level 4	Level 7 Celestial
Active storm duration	7 seconds	10 seconds	14 seconds
Other allied damage against captured enemies	1.4×	1.4×	1.4×
Cooldown	75 seconds	75 seconds	75 seconds

Give this ultimate exceptional modelling, layered shading, fluid animation and beautifully choreographed particles. Its visual identity is an enormous emerald cyclone with a suspended central eye, flowing white-green pressure ribbons and thousands of swirling pink petals.

The atmosphere before the storm

The pet lowers into a braced stance. Fine emerald strands begin drawing across the ground, outlining the storm’s enormous footprint.

Loose leaves and petals initially drift slowly. Then every particle turns toward the same point.

Grass bends inward in a travelling wave. Dust slides across the ground in thin curved streams. Several broad ribbons of wind coil around the pet before unfurling toward the chosen storm centre.

A deep rushing sound builds as the ground pattern brightens from its outer edge inward.

The storm unfolds

Raise a narrow twisting column from the centre. It rapidly expands upward into a colossal swirling canopy, resembling an enormous flower opening through the air.

Build the storm from several distinct layers:

* A broad ground intake that visibly drags leaves, petals and dust inward.
* A twisting lower funnel that lifts enemies toward the central eye.
* A spacious, partially transparent eye containing the gathered enemies.
* A huge upper canopy of curling wind bands and spiralling flowers.

Give the outer wind bands substantial curved surfaces with shaded emerald interiors, translucent mint edges and thin pearly highlights. Smaller white-green streaks race through the gaps.

The silhouette should continuously flex: the canopy expands, the funnel tightens, and long outer ribbons curl around the central mass before being drawn back into its rotation.

Keep the storm recognisable as one immense connected formation.

Gathering enemies into the air

Pull all enemies within the storm’s affected area toward its centre, then lift them into one compact airborne cluster.

Their movement must be continuous: slide inward, rise through the funnel and settle inside the eye. Avoid snapping enemies instantly into position.

Keep their bodies distinguishable with small positional offsets around a shared central anchor. They remain gathered in one place, with subtle suspended movement rather than being thrown around different parts of the battlefield.

Apply the game’s existing displacement-resistance rules where explicitly required. Enemies that resist lifting still receive the storm’s damage and amplification effect while affected.

The caster regains normal control after summoning the storm and can attack its captives alongside the other pets.

The living cyclone

Throughout the active duration, keep every layer moving with purpose.

Large wind ribbons rotate in broad, graceful spirals. Thin pressure streaks move much faster near the eye. Pink flowers enter through the ground intake, climb the funnel and circulate around the upper canopy.

Mix larger, readable blossoms with tiny tumbling petals. Flowers closer to the eye stretch into short luminous trails as they accelerate; those escaping the outer currents slow into individual drifting shapes.

Periodically tighten the inner wind bands around the captured enemies, creating visible pressure pulses that accompany the continuous damage. Let the bands relax slightly between pulses so the storm feels alive.

Use overlapping transparency carefully. Keep the eye sufficiently clear to see the enemies and incoming party attacks through it.

The 1.4× damage amplification

While enemies are captured or otherwise affected by the active storm, damage from other allied attacks against them is multiplied by 1.4, meaning 40% more damage.

This includes the caster’s other attacks, other party pets’ attacks, allied summon attacks and applicable damage-over-time effects.

Pandemonium’s own continuous damage and finishing explosion do not receive its own amplification.

Show the effect with thin emerald currents winding around affected enemies. When another attack lands, these currents briefly tighten around the impact and release a sharp mint flare, making the amplified hit feel stronger.

Preserve the original attack’s colours and identity. The added wind response should enhance its impact.

Ensure melee attacks, projectiles and area attacks can still connect with the suspended enemies. Their visual elevation must not accidentally make them unreachable.

Building toward the final burst

During the final portion of the active duration, the storm begins changing shape without stopping its damage or amplification early.

The upper canopy lowers. Its enormous curling bands fold inward toward the eye. Flowers that were travelling outward suddenly reverse direction and stream into the gathering centre.

The ground intake becomes faster and narrower. Bright emerald lines climb the funnel, carrying the remaining energy upward.

The storm compresses around its captives into a dense, rotating core surrounded by several enormous curved wind petals. Keep the enemies visible through openings between those petals.

Briefly reduce the outer particle motion while the core continues spinning rapidly. This creates a clear moment of anticipation before release.

The final explosion

At the end of the active duration, the compressed storm ruptures in one devastating Wind burst.

Begin with a brilliant emerald-white flash inside the airborne eye. Huge curved sheets of compressed air tear outward in every direction, opening into a gigantic three-dimensional storm blossom.

At the same instant, a powerful column of pressure strikes the floor beneath the eye. A broad circular shockwave races across the battlefield, carrying a dense crest of pink flowers, leaves and glittering emerald particles.

Give the explosion three readable layers:

* The airborne core opening into enormous curved wind petals.
* The descending pressure column connecting the explosion to the ground.
* The expanding ground shockwave sweeping outward beneath it.

Long wind strands stretch between these layers, snap into smaller curling streams and unravel into the aftermath.

Release the captured enemies as the storm breaks, using the existing landing and knockback rules. The finishing blast must hit them reliably before the capture effect clears.

This should be Pandemonium’s strongest individual hit and the most imposing finishing explosion among the offensive Wind ultimates.

Evolution

Level 1: the complete storm already exists: ground intake, lifting funnel, suspended eye, enormous canopy, continuous damage, amplification and a substantial final explosion. Active for exactly seven seconds.

Level 4: increase storm coverage and damage. Add a second layer of broad outer wind bands, richer flower streams and more elaborate pressure pulses around the eye. The final storm blossom opens wider, with longer curling air sheets. Active for exactly ten seconds.

Level 7 Celestial: create a monumental storm with a layered canopy stretching across a large portion of the combat area. Broad emerald ribbons weave above and below one another, while fine pearly currents race through their gaps.

Inside the eye, several delicate pressure rings turn at different angles around the captive enemies. Pink blossoms circulate in immense ascending spirals, making the storm’s height and depth visible.

For the finale, the entire canopy folds inward in a coordinated sequence before opening into the largest storm blossom. Its enormous curved wind petals expand above a sweeping sea of flowers and emerald light. Active for exactly fourteen seconds.

Timing and damage

Start the active-duration timer when the storm begins applying its pull, continuous damage and amplification. End that window with the finishing detonation.

Use fixed gameplay timing for continuous damage, independent of rendering frame rate.

Apply the final explosion as one authoritative AoE damage event. Its airborne petals, descending column and ground shockwave are coordinated parts of the same finishing hit.

Maintain the 75-second cooldown at every level. Balance Pandemonium as the supreme offensive Wind ultimate through its sustained damage, enemy gathering, party amplification and powerful finale.

Aftermath

Let the remaining wind travel outward and upward. Pink petals gradually lose speed and drift toward the floor. The ground pattern fades from its perimeter inward while the last emerald strands unravel above the impact centre.

Remove the amplification when the active storm ends, and clean up all capture effects, temporary movement states and visual objects.