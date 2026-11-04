Cocopets — 10 Pink Light Strong Attacks

Copy-ready prompt for Claude

Upgrade the Light element’s strong attacks into the ten skills described below. They must have the same craftsmanship as the ultimates: beautiful 3D shapes, layered materials, polished animation, carefully directed particles and satisfying impacts. They belong in the Strong Attack category, with responsive combat pacing and the project’s strong-attack damage, cost and cooldown conventions. Preserve the complete visual sequences while fitting those conventions.

Inspect the existing game, Light attacks, animation hooks, targeting, shaders, projectile handling and damage pipeline before editing. Upgrade matching skills in place where possible. Retain Lantern Fall’s sequential lantern-opening and descending-light mechanic. Convert Palace of Mirrors into the strong attack Love Mirrors, retaining its ricocheting lance and coordinated downward finale. Update its display name, classification and any affected skill references coherently. Do not leave two selectable copies of the same migrated skill.

The first seven designs below are the user’s concepts. The final three are new additions. Required user-specified values take priority over suggested defaults. Proposed counts, timings, ranges and control durations should be configurable. Use the existing balance system for unspecified damage and cooldowns. Do not substitute generic placeholder effects or provide descriptions in place of implementation.

Art direction and shared quality

The theme is cute, girly, magical and luminous: candy-pink light, rounded love hearts, pearly highlights, little stars, elegant ribbons, delicate rose-gold details and shimmering glass. Pink must remain the dominant colour, including in attacks that originally used warm gold light.

|Use                      |Colour   |
|-------------------------|---------|
|Main glowing pink        |`#FF69B4`|
|Soft blossom pink        |`#FFB7D5`|
|Deep pink shaded accents |`#D94B91`|
|Pearly light cores       |`#FFF0F7`|
|Lavender reflections     |`#D8B4FF`|
|Restrained rose-gold trim|`#E8AFB8`|

Build reusable thick, rounded, beveled heart meshes and tubular heart outlines. Their contours must remain recognisable from the gameplay camera. Use moving highlights, darker side faces and gradual edge emission to show volume. The heart outline in Honey Sugar Heart Attack needs a genuinely open centre. Stars can be simple beveled five-pointed shapes. Light wings can be assembled from curved tapered ribbons with feather-like silhouettes; no new humanoid rig is required.

Give lanterns, mirrors and seals real depth, frames, bevels and articulated parts where described. Use shaded satin ribbons with smooth curves, visible width and graceful twist. Give magical glass a translucent shell and a brighter inner structure using the engine’s supported shading features. Preserve darker pink areas so the objects remain legible under bloom. Use screen-space glow around narrow bright edges; avoid uniformly overexposing entire objects.

Every skill needs formation, anticipation, release, impact and decay. Keep short windups expressive through body motion, assembling shapes and changes in light intensity. Let ornaments lag behind movement and settle afterward. Trails must follow actual paths, widen or narrow with speed, and taper naturally. Impact hearts should emerge from the contact point, tumble outward, float upward as they slow and fade individually. Mix a few readable large hearts with many smaller glints rather than filling the view with equally sized sprites.

Keep pink ground light, impact ripples and airborne particles synchronised with the attack. Use delicate chimes, soft magical whooshes and crisp sparkling impacts, with stronger low-frequency accents for bombs and stamps. Respect existing effects and camera settings. The pet and enemies must remain readable throughout.

Level 1 is already polished and complete. Level 4 introduces richer layers and more elaborate choreography. Level 7 Celestial has the most sophisticated shapes and coordinated motion. Additional particles alone are insufficient progression. Hold discrete counts until their specified breakpoint; interpolate continuous stats and visual richness through levels 2, 3, 5 and 6. Let H denote the pet’s ordinary standing height, independent of its current pose.

Keep gameplay independent of frame rate and decorative geometry. Use explicit hit events, projectile identities and per-target hit tracking. A chain link, sparkle, wing feather or heart particle should not create an extra damage event. Pool repeated models and particles. Maintain the required attack counts when reducing secondary particles for performance. Follow existing targeting, crowd-control resistance and interruption rules. Remove temporary lights, effects, timers, target references and movement modifiers when finished.

1. Honey Sugar Heart Attack

Identity: the pet pushes enormous glowing heart outlines forward; each breaks open on impact and produces a substantial pink Light explosion.

Required heart projectiles: level 1: one; level 4: two; level 7 Celestial: three. Each heart produces its own AoE attack.

Model: create a thick tubular heart outline with a rounded cross-section and an open centre. Give the tube a translucent pink outer layer, a pearly inner light and a thin hot-pink rim. Add two fine light strands winding along the outline. Proposed height is approximately 1.6H at level 1, increasing moderately with evolution. Maintain a clear indentation between the upper lobes and a rounded lower point.

Animation: collect small pink lights in front of the pet, tracing the outline from its bottom point around both sides. When the outline closes, it gives a small elastic pulse. The pet leans or thrusts forward using its existing casting motion, visibly pushing the heart away. The heart accelerates through the air, gently banking while keeping its shape readable. Two thin ribbon trails stretch from its lower curves; small stars peel off behind it.

Impact: briefly compress the outline against the collision point. Bright cracks race around the tube before it breaks into curved luminous fragments. Simultaneously release a circular pink shockwave and a puff of little love hearts. Add a bright contact core, a larger soft halo and a short heart-shaped ground ripple. Give each projectile one AoE detonation; the outline fragments and miniature hearts are decorative. Use a collision volume covering the heart’s silhouette so enemies do not harmlessly pass through its open centre.

At level 4, launch two hearts in quick succession with slightly opposing banks. At Celestial, launch three on gently braided routes, with the final heart slightly larger and more ornate. Preserve three separate impact bursts. Route the hearts through nearby targets or the selected area; keep targeting consistent with the existing projectile system. Fade a missed projectile at its maximum range without an unconfigured off-screen attack.

2. Luv Me Luv Me Chain

Identity: the pet swings a chain made from glowing pink heart links, whipping enemies in sweeping arcs.

Required lash strikes per cast: level 1: two; level 4: three; level 7 Celestial: five. The chain also gets longer with evolution. This interprets the requested number of whips as successive strikes from one chain.

Model: construct connected, thick heart-outline links with polished pink surfaces, bright inner rims and pearl highlights. Alternate their orientations so the links visibly interlock. Give the last link a larger heart charm with a short trailing ribbon. Suggested reaches are 2H, 2.6H and 3.3H at the three evolution stages, adjusted for arena scale.

Formation: a small heart near the pet unspools into a loose curved chain. Attach it to an appropriate existing casting point on the pet; do not add a human hand. The pet twists its body into the first swing while the chain initially trails behind.

Whipping motion: propagate a wave from the chain’s root toward its tip. The links first stretch outward, then the terminal heart snaps through the enemy area with the fastest motion and brightest trail. Allow the chain to slacken and reverse direction between strikes. At level 1, use a left-to-right lash followed by a returning right-to-left lash. Level 4 adds a diagonal finishing snap. Celestial adds two further alternating sweeps, ending with the widest controlled arc.

On contact, generate a thin pink impact slash, a cluster of miniature hearts and a quick pearly star flash. The chain stays intact during all its strikes. Use one swept damage volume per lash and one hit per enemy per lash; individual links must not multiply damage. Longer reach should be reflected in both the visible chain and its hit area.

After the final strike, recoil the chain into a suspended curve, then draw its links back into the casting heart in sequence. Let the final charm spin once and dissolve. Richer Celestial trims and trailing filaments should follow the moving chain without hiding its links.

3. Lantern Fall

Identity: elegant pink lanterns appear above enemies, open one after another and release descending columns of magical light. Preserve the original sequential opening and column-release mechanic.

Proposed lantern counts: level 1: three, preserving the original base concept; level 4: five; level 7 Celestial: seven.

Model: create small suspended lanterns with rounded hexagonal bodies, pearly pink translucent panels, thin rose-gold frames and glowing heart motifs. Give each a delicate top loop, a lower crystal heart and two short ribbon tassels. Their construction should be visible from the gameplay camera. Use beveled frame bars and a bright internal heart-shaped light source.

Formation: tiny hearts trace circles above the target area. The lanterns assemble within those circles, lowering slightly as their tassels swing behind them. They hover in a staggered arrangement with their internal lights slowly intensifying. Mark each intended column footprint with a soft pink heart-ring on the ground.

Release: lantern panels hinge outward like petals. A concentrated white-pink core pours down into a broader translucent pink column, with fine spiral strands turning around it. The hanging crystal heart brightens at the moment the column strikes. Spread a compact ground ripple and let small hearts rise along the column’s outer edge, moving against the descending light.

Open the lanterns in a readable sequence, approximately 0.12–0.18 seconds apart as a proposed pacing. Each opening delivers one AoE strike in its marked footprint. Its short remaining column glow is visual, unless the existing skill explicitly uses separately defined sustained ticks. Keep the complete attack brisk enough for the strong-attack category.

At level 4, add a second staggered height and richer heart cutouts. At Celestial, arrange seven lanterns in a graceful canopy, with the last central lantern slightly larger. Its final release completes a temporary flower-like pattern of pink floor ripples. All lanterns then close partway and dissolve from their lower ornaments upward into hearts and pearly sparks. They release light from above; they do not need to behave as falling physical bombs.

4. Love Mirrors

Identity: rename Palace of Mirrors to Love Mirrors and convert it to a strong Light attack. Preserve its floating mirror circle, ricocheting light lance and coordinated downward firing finale.

Proposed mirror counts: level 1: three; level 4: five; level 7 Celestial: seven.

Model: use tall rounded mirrors with thick, beveled pink frames, small heart crests and rose-gold details. Give each reflective face a gently animated pearly surface with a clearly visible glowing heart suspended within it. Add fainter heart reflections behind the central heart to suggest depth. Use supported reflection techniques or a layered reflection-style material; expensive recursive scene reflections are unnecessary to achieve this look.

Formation: raise the mirrors around the target area in a circle, each angled toward the centre and tilted enough to remain visible from the gameplay camera. Their frames unfold from two curved pieces, then lock together. Heart symbols pulse on in sequence as a narrow pink light lance leaves the pet and enters the first mirror.

Ricochet sequence: the struck mirror’s inner heart flares and sends the lance onward through a nearby enemy position toward the next mirror. Continue along a deliberate, finite route around the formation. Show each bend with a short mirror-face ripple and a burst of tiny hearts. Keep recently travelled lance segments visible briefly so the route reads as a sparkling pink constellation, then fade them before the screen becomes crowded.

Finale: all mirrors tilt downward together. Their central hearts expand and release short pink light shafts into the enemy area, creating a coordinated set of heart-shaped impact ripples. Define the lance’s damage events separately from the finale. Each real damaging segment can hit an enemy once; an illuminated frame is not an additional projectile. Tune the complete sequence for a strong attack while retaining both phases.

At level 4, add richer frame trim and deeper moving heart reflections. At Celestial, use seven mirrors at slightly staggered heights, brighter heart crests and a synchronized frame-light pulse before the downward volley. Finish by separating the frames into curved pink glints while their surfaces dissolve into hearts and silver-pink flakes. Keep the full choreography around 2.5–3 seconds as a proposed target.

5. Love Shock

Identity: the pet grows luminous wings and fires bouncing spheres of pink Light that burst with miniature hearts and stars on every hit.

Required spheres: level 1: three; level 4: five; level 7 Celestial: six. Required bouncing duration: three seconds at every level.

Wing model: form a symmetrical pair of wings from overlapping tapered light ribbons. Use five or six larger feather-like ribbons per side as the readable silhouette, with smaller interior streaks. Shade the roots deep pink, brighten the middle to candy pink and finish the tips with pearly light. The wings attach to the pet’s back, follow its body, and unfold from tucked curves into a graceful open span. Their construction can remain abstract without detailed anatomy.

Sphere model: use a translucent pink outer shell with a bright pearl core and a small rotating heart inside. Add a thin orbiting sparkle strand. Keep the sphere’s round volume visible. The proposed diameter is approximately 0.35H, large enough to see its inner heart from the gameplay camera.

Launch: spread the wings, draw the spheres into an arc in front of the pet, then snap the wings forward to release them. Use short trailing curves that originate from the sphere positions. Keep all required spheres individually visible during the launch.

Bouncing: after each sphere’s first enemy impact, start that sphere’s three-second ricochet timer. It rebounds along short curved routes toward other valid enemies, producing little hearts and stars at each contact. Avoid teleporting between targets. If only one enemy remains, allow a short looping rebound and a repeat hit after a defined proposed 0.3-second per-sphere, per-target delay. The number of hits must be governed by travel and hit timing, not frame rate. If no valid enemy remains, let the sphere fade instead of searching indefinitely.

At level 4, add a second layer of wing ribbons and richer sphere trails. At Celestial, broaden the wing silhouette and arrange six launch spheres symmetrically, with coordinated but independent bounce paths. Wings settle after firing and dissolve from their tips inward; they do not confer flight or invulnerability. Each sphere’s damage ends when its three-second timer expires. Its final heart-and-star pop is decorative, avoiding an undocumented extra hit.

6. Love Bombs

Identity: hurl two heart bombs into the battlefield. Each detonates in a substantial AoE explosion of pink Light and little love hearts.

Required base count: two bombs. Keep two at levels 4 and 7 as well, since no higher count was requested; improve their coverage, damage, model and burst composition instead.

Model: create plump 3D hearts with glossy candy-pink shells, pearly edge highlights and a soft internal glow. The lobes should be round and the lower tip softly tapered. Add a fine rose-gold seam and a short magical fuse made of tiny linked lights. Place a small luminous heart charm at the fuse tip. The object should look substantial as it turns through the air.

Throw: form the two bombs beside the pet, lift them on slightly different arcs and hurl them toward two selected ground positions. Give the bombs a slow tumble, with their fuse lights and a short ribbon trail lagging behind. Show a small heart footprint at each landing point. Stagger the launches slightly so the separate arcs are easy to follow.

Impact and explosion: squash the heart subtly on contact, allow a very short bright pulse, then split the shell along its seam. Release a sharp pearly centre flash, a broad translucent pink shockwave and a rounded cloud of rising miniature hearts. Mix larger slowly tumbling hearts with tiny fast stars. Let curved fragments of light peel away and vanish before becoming visual clutter.

Each bomb produces one AoE damage event. Decorative shell fragments and hearts do not damage enemies separately. At level 4, increase the blast radius moderately and add a second thin visual ring around the main shockwave. At Celestial, add layered heart patterns inside the shell and a more elaborate, flower-like arrangement of burst particles. Two well-defined explosions should remain readable even when they overlap. Suggested radius multipliers are 1.0 / 1.2 / 1.4; use the existing damage progression.

7. Eternal Light

Identity: pink light erupts from the ground in elegant, wavy spirals, sweeping through enemies across a broad marked area.

Proposed erupting swirls: level 1: three; level 4: five; level 7 Celestial: seven. Suggested total release sequences are approximately 1.8 / 2.4 / 3 seconds.

Ground preparation: thin pink lines draw flowing S-curves across the target footprint. Small hearts appear along them, rise a little and dissolve as the lines brighten. Maintain enough empty ground between the curves to see enemies clearly.

Eruption: each line lifts into a wide ribbon of Light, curling upward and forward in a loose helix. Use a pearly centre stripe, saturated pink edges and a softer translucent sheet around the main ribbon. The base remains connected to the glowing ground path while the top bends and sheds tiny stars. Animate the shape continuously along its length so it looks like flowing light rising from the floor.

Send the swirls through the area in staggered waves. They sweep across the marked enemy space rather than remaining fixed as straight columns. Each swirl’s travelling strike volume can damage an enemy once as it passes; the sparks and residual floor light are decorative. “Everything in sight” means all eligible enemies reached inside the skill’s marked combat area, using the existing targeting range.

At level 4, make the upper ribbons fork into delicate secondary strands while retaining the main sweeping silhouette. At Celestial, seven swirls rise in a coordinated outward sequence, briefly forming an open luminous blossom of pink ribbons above the battlefield. Let the tops unwind into airborne hearts as the ground paths fade from their ends inward. Maintain strong Light damage without allowing visual overlap between ribbon layers to create duplicate hits.

8. Sweetheart Stamp — new

Identity: a giant floating heart seal presses down onto enemies, stamping glowing love hearts into the battlefield with explosive force.

Proposed presses: level 1: one; level 4: two; level 7 Celestial: three.

Create a thick heart-shaped seal approximately 2H wide, with pearly pink side faces, beveled rose-gold rims and nested glowing heart engravings on its stamping face. Give it enough thickness to appear physical. It can be built from one extruded heart and simple trim meshes; no hand or character needs to hold it.

The seal appears at an angle above the target so its face is initially visible, rotates flat, then descends quickly. Just before contact, draw fine pink light threads between its face and a matching heart on the ground. The impact compresses a soft pink light cushion, releases a sharp heart-shaped ripple and launches little hearts outward.

Each press produces one AoE hit. For repeated presses, rebound the same seal upward along a continuous arc, tilt slightly, then stamp again. Avoid creating a new seal at every impact. At level 4, its second press leaves a brighter double-outline heart. At Celestial, three presses build an ornate nested heart sigil; the last press is slightly larger and uses the strongest configured damage coefficient.

After the finale, the seal rises, turns its glowing face toward the gameplay camera and dissolves into pearl-pink fragments. Its floor engraving lingers briefly as a visual afterglow. Use a crisp magical thump and glittering chime to make the impact powerful while maintaining the cute aesthetic.

9. Ribbon Rendezvous — new

Identity: luminous satin ribbons wrap selected enemies in oversized pink bows, tighten with a damaging pulse, then burst into hearts.

Proposed simultaneous bow targets: level 1: one; level 4: two; level 7 Celestial: three. Proposed root durations are 0.75 / 1.0 / 1.25 seconds, subject to existing resistance rules.

Send two thin ribbon streams from the pet toward each selected enemy. They travel on separate curving paths, then sweep around the target in opposite directions. Build them as curved strips with shaded pink upper faces, darker undersides and pale reflective edges. Allow their ends to flutter with inertia rather than rotating like rigid beams.

The ribbons meet at the front of the target and form one oversized bow: two rounded loops, a bright heart-shaped central knot and two curling tails. Fit the effect to the target’s bounds so the bow is visible without hiding its entire model. Tighten the loops briefly, apply one direct Light hit and the configured short root, then let the tails sway during the hold.

At release, the knot flashes and the ribbon edges unravel into tiny hearts. Apply one small AoE burst around that target. The initial hit and final burst are distinct scheduled events. A target immune to rooting still takes the intended damage. The bow must not physically drag or deform the enemy model.

At level 4, two bows form in a staggered flourish. At Celestial, three bows use richer pearl edging and little star charms at their tails; their final heart bursts occur in a short sparkling sequence. If fewer valid enemies exist, use fewer bows rather than stacking several on the same enemy by default. Keep this skill’s identity as a short control-and-burst attack.

10. Sugar Rush — new

Identity: the pet dashes through enemies inside a brilliant pink comet of Light, leaving flowing heart trails and sparkling cutting impacts.

Proposed dash passes: level 1: one; level 4: two; level 7 Celestial: three.

Gather a loose spiral of tiny hearts around the pet. They sweep backward as a bright pink contour wraps around its body. Form a small luminous heart at the leading point and two long pearly ribbon trails behind it. Keep the pet visible inside the glow so the player can follow its movement.

Launch the actual pet along a validated short dash route through the selected enemy area. Its body leans into the movement; existing ears, tails or accessories trail behind naturally. Use a swept hit volume along the real path, giving each enemy at most one damage event per dash pass. On contact, create a brief diagonal pink slice and a spray of little hearts and stars.

At level 4, add a returning diagonal pass. At Celestial, use three connected passes that draw a clean zigzag or loose triangular route through the enemy group. Connect the route at real endpoints, with visible turns and continuous motion. Decorative afterimages are visual only. Do not teleport through walls or move the pet outside valid navigation; shorten or redirect a blocked pass using existing movement rules.

Give each completed pass a small fan of trailing hearts. On the final stop, the ribbons curl around the pet and open into a soft heart outline before fading. Use richer layered trails and longer pearly light strands at Celestial. This is a mobility attack: it does not automatically grant invulnerability. Restore normal movement as soon as the final pass settles and cleanly release any temporary movement control on interruption.

Progression reference

|Skill                   |Level 1         |Level 4          |Level 7 Celestial|Status of count                     |
|------------------------|----------------|-----------------|-----------------|------------------------------------|
|Honey Sugar Heart Attack|1 outlined heart|2 outlined hearts|3 outlined hearts|Required                            |
|Luv Me Luv Me Chain     |2 lashes        |3 lashes         |5 lashes         |Required; also increase length      |
|Lantern Fall            |3 lanterns      |5 lanterns       |7 lanterns       |Base retained; upgrades proposed    |
|Love Mirrors            |3 mirrors       |5 mirrors        |7 mirrors        |Proposed                            |
|Love Shock              |3 spheres       |5 spheres        |6 spheres        |Required; 3 seconds of bouncing each|
|Love Bombs              |2 bombs         |2 bombs          |2 bombs          |Base required; later count retained |
|Eternal Light           |3 swirls        |5 swirls         |7 swirls         |Proposed                            |
|Sweetheart Stamp        |1 press         |2 presses        |3 presses        |Proposed                            |
|Ribbon Rendezvous       |1 bow target    |2 bow targets    |3 bow targets    |Proposed                            |
|Sugar Rush              |1 dash          |2 dashes         |3 dashes         |Proposed                            |

Completion requirements

Implement the ten strong attacks and their level progression. Preview them from the real combat camera at levels 1, 4 and 7. Check the exact user-specified counts, the chain’s increasing length, Love Shock’s three-second ricochet timers, and the separate AoE explosions of Honey Sugar Heart Attack and Love Bombs. Check that Lantern Fall retains its opening lanterns and descending columns, and Love Mirrors retains its ricochet sequence plus downward finale after conversion.

Confirm that attacks still read as pink hearts, lanterns, mirrors, wings, bows and flowing Light when bloom is reduced. Ensure attack silhouettes and intended damage remain correct with reduced secondary particles. Verify hit timing, cleanup, target loss and interruption using the project’s existing checks. Report what was implemented and any specific missing engine capability honestly; only claim previews or checks actually performed.