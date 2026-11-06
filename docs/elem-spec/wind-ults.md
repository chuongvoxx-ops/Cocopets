# Wind ultimates — the user's spec (verbatim, 2026-11-06)

The user: "Create these 4 wind ults, use 4 workers." Plus the user's master implementation prompt (below the four specs), which applies to all.

## Wind ultimates

### W1\. Flower Hurricane — original concept

**Core identity:** seven separate, flower\-filled twisters roam through the battlefield\. Their smaller scale, wandering routes and rich pink petal streams distinguish them from the enormous travelling tornadoes of Terrible Tornado\.

|Property                  |Level 1  |Level 4   |Level 7 — Celestial|
|--------------------------|---------|----------|-------------------|
|Twisters — required       |7        |7         |7                  |
|Active duration — proposed|6 seconds|8 seconds |10 seconds         |
|Visual size — proposed    |Base     |1.25× base|1.55× base         |

**Formation:** a delicate pink wreath rotates beneath the pet\. Seven bright flower clusters separate from the wreath and travel to seven nearby positions\. Over approximately 0\.7 seconds, a narrow rising current catches each cluster\. Petals climb around an invisible corkscrew, followed by mint wind ribbons that widen into seven complete twisters\. Make the base version approximately 2H tall with a broad, readable upper funnel and a narrow, moving ground contact\.

**Active animation:** send the twisters along different smooth routes through enemy groups\. Use broad curves, occasional banks and controlled steering\. Their centres should remain spread enough to read as seven distinct attacks\. Let two briefly braid past each other, then separate; avoid constantly overlapping all seven on one point\. A twister’s collision area damages enemies it passes through on its gameplay tick\.

Build each funnel from several translucent curved wind bands, bright pressure streaks and a less saturated inner current\. Have pink flowers enter near the floor, spiral upward and peel away at the top\. Larger five\-petal blossoms tumble slowly near the outside; tiny petals accelerate near the core\. Add a low ground spiral of leaves, petals and faint dust that follows the travelling contact point\.

At level 4, add a second ribbon layer and coordinated crossing paths\. At Celestial, give each funnel a pale mint inner spiral and a distinct pink outer stream; the seven routes briefly form a loose rotating flower around the enemy group before spreading again\. This is still seven twisters\. End with the ribbons unwinding upward into seven blossom fountains, then let remaining petals drift down\. Do not add an undocumented damage burst just because the exit is beautiful\.

### W2\. Monsoon — original concept

**Core identity:** one sustained vortex stays at the chosen area, pulling enemies inward and continuously damaging them\.

|Property                  |Level 1   |Level 4   |Level 7 — Celestial|
|--------------------------|----------|----------|-------------------|
|Active duration — required|7 seconds |10 seconds|12 seconds         |
|Cooldown — required       |25 seconds|25 seconds|25 seconds         |
|Suggested field radius    |3H        |3.75H     |4.5H               |

**Formation:** dim the centre of the selected ground area slightly with a soft teal pressure decal\. Loose petals and tiny dust particles first tremble, then slide inward along curved paths\. Broad, nearly horizontal wind sheets curl around the edge, rise and fold toward a narrow central updraft\. Give the completed effect a wide, storm\-like bowl silhouette with an open, readable centre\.

**Active animation:** maintain a clear inward flow across the ground and an upward flow through the centre\. Outer mint bands rotate slowly; thinner inner streaks rotate faster\. Layer short, pale pressure arcs above the floor so the pull can be read even with particles reduced\. A few pink blossoms help communicate speed but should not dominate this skill’s green and white storm palette\.

Apply continuous Wind damage and a capped inward pull throughout the exact active duration\. Pull hostile targets and loose visual debris; do not drag allies or actual arena geometry\. Enemies should approach the core smoothly rather than snap to its centre\. Retain damage against enemies that resist displacement\. Keep the cast position fixed after formation\.

At level 4, increase the width and introduce an elevated second circulation band\. At Celestial, create three visible airflow layers: a broad ground intake, an angled middle funnel and a narrow vertical release\. They belong to one vortex\. Let periodic ripples travel inward through all three layers\. At expiration, the outer bands collapse toward the centre and vent upward into a thin stream of petals\. Stop damage and pull when the duration ends; the fading exit is visual only\. Start the 25\-second cooldown on activation, unless the existing game explicitly defines cooldown timing otherwise\.

### W3\. Terrible Tornado — original concept

**Core identity:** enormous, decorated tornadoes travel across the battlefield\. Reference the project’s Catastrophe effect for its existing character and motion, then make this Wind version wider, taller and richer in airflow and pink flowers\.

|Property                  |Level 1  |Level 4  |Level 7 — Celestial|
|--------------------------|---------|---------|-------------------|
|Tornadoes — required      |1        |3        |6                  |
|Suggested active duration |6 seconds|7 seconds|8 seconds          |
|Suggested principal height|4H       |5H       |6H                 |

**Formation:** spread a large ground spiral ahead of the pet\. Pink petals sweep outward around its circumference, then turn sharply inward as the central column rises\. Build from a narrow rotating stem into a vast upper funnel\. Add a visible surge of air through the entire column when it reaches full size, making the launch feel powerful\.

**Travel:** the tornado advances through a planned sweeping route, leaning subtly in its direction of travel\. Its upper funnel should lag behind turns while the ground contact steers first\. Keep its silhouette full and tall even when it moves\. Show broad translucent mint bands, thinner white cutting streaks, occasional emerald pressure seams and substantial pink flower streams\. A travelling ground ring throws petals outward and lifts dust around the base\.

At level 4, arrange three tornadoes in staggered lanes with slightly different heights, leaving readable gaps\. At Celestial, send six across interleaved routes: an outer trio sweeps around the arena while an inner trio crosses the main enemy area\. Offset their formation by a small fraction of a second for a rolling entrance, but allow all six to be visibly active together\. Coordinate paths to avoid six opaque funnels occupying the same location\.

Each tornado has its own intended damage ticks and hit area\. Multiple tornadoes may damage the same enemy when their real areas overlap; decorative ribbon layers must not multiply those hits\. Finish with the columns stretching upward, opening into broad flower spirals and shedding their remaining wind along the floor\. If Catastrophe is unavailable, use this described wide funnel choreography as the explicit fallback and report that the reference was missing\.

### W4\. 1000 Blades — original concept

**Core identity:** enormous physical samurai swords appear, then transform into a deadly swarm of green flowers\. The swarm moves with the coordinated flow of insects; do not model literal insects\.

|Property                                        |Level 1  |Level 4  |Level 7 — Celestial|
|------------------------------------------------|---------|---------|-------------------|
|Samurai swords — required                       |10       |30       |60                 |
|Green flower fragments — proposed interpretation|100 total|300 total|600 total          |
|Active swarm duration — proposed                |4 seconds|5 seconds|6 seconds          |

**Interpretation:** treat the original 100 flower pieces as the total produced by ten swords: ten green flower fragments per sword\. Apply that same ratio at the later levels\. The skill name does not require inventing 1,000 gameplay projectiles\.

**Sword models:** create solid, gently curved katana blades with visible thickness, a tapered point, a bright cutting bevel, a darker steel back and a subtle wavy temper line\. Include a physical guard, dark wrapped grip with simple raised diamond wrapping, metal collar and pommel\. Use restrained emerald inlays and edge reflections\. Each sword should be approximately 1\.5H long and remain visibly metal before transforming\.

**Formation and transformation:** raise ten swords in a fan around and above the casting position, their tips angled toward the enemy area\. For thirty and sixty swords, use several staggered arcs or tiers so the weapons remain legible\. Hold briefly while a green shimmer travels from the grips to the tips\. Fine luminous seams divide the weapons into segments\. Those segments peel away and morph into green flower fragments, consuming the source swords rather than leaving duplicate weapons behind\. Aim for approximately 0\.7 seconds of assembly and 0\.4 seconds of transformation\.

Use small folded five\-petal meshes and sharper petal silhouettes with varied emerald, jade and pale green faces\. Give them thickness or shading that reads from the gameplay camera\. Each flower rotates as it flies; each petal edge catches a brief pale highlight\.

**Swarm motion:** form one coherent stream that banks through enemies, divides into several smaller streams and reunites for another cutting pass\. Use local orbiting and avoidance within those streams to create lively swarm motion without random visual noise\. At level 4, braid three streams around the main target area\. At Celestial, arrange six streams in a large opening flower, then fold them into a rapid, coordinated final cutting pass\. End by letting the flowers lose speed and dissolve into tiny green motes\.

Use grouped swarm volumes and defined cutting pulses for gameplay\. The 100, 300 or 600 flowers are visual instances, not hundreds of independent damage checks every frame\. Scale the configured damage and coverage with evolution while keeping the displayed fragment counts consistent with this interpretation\.

---

Master implementation prompt

Create these nine Wind and nine Earth ultimates in the existing Cocopets project. I want beautiful, carefully animated effects with readable silhouettes, detailed physical models where specified, convincing materials, controlled glow and satisfying impacts. Each ultimate must have its own recognisable choreography. Level 1 should already look finished and impressive; level 4 adds complexity; level 7 is the Celestial version, with a deliberate composition and a stronger finale.

Inspect the existing engine, skill system, damage pipeline, targeting, pet animation, shaders, pooling and effect assets before implementing. Reuse the project’s architecture and visual style. Locate the existing Catastrophe effect before adapting it for Terrible Tornado. This brief does not contain Catastrophe’s actual implementation: use the project’s asset as the reference if it exists, and disclose if it cannot be found. Do not claim an exact visual match without inspecting it.

Use the existing stylised art direction with rich material shading. Build most effects from curved ribbons, rings, tapered volumes, faceted rocks, prisms and instanced petals. The samurai swords in 1000 Blades must be detailed physical weapons before transforming. Animate the existing pet for Shockwave Trampoline. These skills do not require new humanoids, hands, animals or elaborate character rigs.

Shared visual direction

• Wind palette: mint #73E8B6, emerald #16A57B, pale air highlights #E7FFF6, blossom pink #FFAFD2, and deeper petal accents #DE5A9A. Use pink flowers for Flower Hurricane and Terrible Tornado. Use green flowers for 1000 Blades. Wind should feel translucent, fast, airy and graceful, with sharp pressure changes during attacks.
• Earth palette: golden yellow #F6BD42, pale mineral highlights #FFE5A0, warm basalt #55504A, dark stone #2A2220, and ember amber #B96A26. Earth should feel dense, weighty and mineral. Ember veins and drifting embers are an Earth visual motif; these abilities still deal Earth damage.
• Surface quality: give physical objects thickness, bevels, coherent normals, restrained roughness variation, contact shading and appropriate lighting. Rock faces must remain readable around glowing fissures. Sword edges must catch moving highlights. Crystals need faceted highlights and darker interior planes, with layered depth using the shading features the engine supports.
• Glow quality: reserve the strongest emission for narrow edges, cracks, runes, pressure seams and impact cores. Keep broad surfaces shaded. Bloom should soften a luminous edge without erasing the model or turning the battlefield into an opaque white patch.
• Particle choreography: define where particles originate, which direction they travel, how turbulence affects them, how they rotate and how they disappear. Petals should tumble independently while following a coherent larger current. Earth chips should follow weighted arcs; fine dust should spread low across the floor and settle.
• Animation: give each cast anticipation, formation, an active action, an impact or release, and a graceful exit. Use easing that matches the material: wind gathers and accelerates; stone commits to heavy motion and settles. Keep moving objects continuous rather than teleporting between points.
• Ground interaction: support airborne effects with ripples, dust, grass or petal movement, contact shadows, cracks, glancing light and restrained distortion. Ground decals and temporary rock formations should follow the arena surface and expire cleanly.
• Readability: keep the pet and enemies identifiable from the actual gameplay camera. Use layers of thin wind ribbons with gaps between them. Avoid filling every gap with smoke or glow. Respect the project’s existing camera-shake and effects settings.

Use H below as the pet’s normal standing height, measured independently of its current animation. All suggested dimensions are relative art defaults; adapt them to the actual arena and camera while preserving the intended hierarchy.

Shared gameplay and engineering direction

Keep damage, targeting, durations and hit events separate from decorative particle counts. Continuous damage should use a fixed gameplay tick, proposed at 0.5 seconds unless the project already has a suitable convention. An effect must behave consistently at different frame rates. Give each projectile, shockwave, volley or damage pulse a defined identity so one intended hit cannot accidentally fire several times from overlapping visual components.

Use the existing balance system for damage coefficients, ranges and cooldowns not explicitly fixed in this brief. Expose proposed values in skill data. Do not invent additional mandatory multipliers or flatten all Celestial skills to level-1 damage. Additional damaging swords, tornadoes, crystal waves and other attacks should contribute according to their configured mechanics.

Use the level-1, level-4 and level-7 counts exactly as specified. Hold discrete counts until their stated breakpoint; interpolate continuous values at levels 2, 3, 5 and 6. Intermediate levels should improve damage and visual richness without triggering the next evolution’s main count increase early. Derive duration and animation scheduling from the same skill data.

Default targeting is hostile creatures, with party damage disabled. For Rock Steady, this interprets “every creature nearby” as every nearby enemy; keep the game’s friendly-fire policy configurable. Use existing control resistance for bosses while still applying damage. Cosmetic cracks, petals and stone fragments should not create permanent terrain changes or unintended navigation barriers.

Pool repeated meshes and particles; instance flowers, swords, crystals and rocks where supported. Keep large defining shapes, exact gameplay counts and important impact effects intact when reducing distant secondary particles. Clean up effects, temporary lights, damage timers and targeting references on normal completion or interruption.