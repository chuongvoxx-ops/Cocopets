# Cocopets: Seven Gothic Dark Ultimates — Claude Implementation Prompt

Implement seven premium Dark\-element ultimates for my existing Cocopets action RPG: Dead Scream, Umbra Heart, Final Eclipse, Doomsday, Thriller, Annihilation, and Requiem\. Their identity is death, darkness, gothic magic, deep purple light, and powerful supernatural animation\. Preserve the existing game engine, renderer, controls, camera, party systems, pet evolution, and working ability architecture\.

Build functioning abilities with deliberate models, shading, animation, sound events, targeting, and combat behaviour\. Inspect the actual project before selecting implementation techniques\. Do not present a static mockup or a description as an implemented effect\.

## Art direction

Dark bodies should look almost black, with visible violet depth and selective purple edges\. Keep broad shadowed surfaces distinct from narrow luminous cracks\. Use smoke, dark liquid, shattered halos, black feather particles, floating fragments, pointed gothic shapes, and fictional geometric sigils\.

|Use                               |Proposed colour|
|----------------------------------|---------------|
|Deepest void                      |`#08050F`      |
|Main dark-purple body             |`#180B2E`      |
|Deep plum interior                |`#2B0B45`      |
|Smoky violet shading              |`#463052`      |
|Active purple energy              |`#6D28A8`      |
|Narrow luminous edges             |`#A55CFF`      |
|Tiny high-intensity impact accents|`#D0AEFF`      |

Very dark purple remains dominant\. Reserve brighter violet and lavender for thin contours, eyes, fractures, and the most concentrated impact accents\. Avoid turning entire effects into bright neon\-purple masses or featureless black silhouettes\. Provide enough surface shading and rim contrast for the models to read against both dark and bright environments\.

Match the game’s stylised 3D look\. Use controlled roughness variation, visible thickness, clean silhouettes, suitable normals, and carefully layered transparency\. Animate energy travelling through cracks, liquid pulling into strands, smoke following airflow, and fragments inheriting the movement that releases them\. Keep bloom restrained around dark main forms\.

Use deep, weighted impact sounds, low resonant pulses, spectral whispers or choir\-like textures if suitable original or licensed assets exist, and sharp crystalline accents for void fractures\. Keep the mix readable rather than continuously loud\.

## Models and the updated constraint

The earlier preference for abstract geometry still applies to energy effects and most props\. However, the current request explicitly requires a skull, a raven\-winged demon, and detailed zombified Cocopets\. These are intentional model exceptions\. Do not replace them with generic spheres or remove the demon’s hands and wings\.

Reuse existing models, rigs, animation clips, and attachment points when suitable\. Build additional geometry where necessary and retain the requested forms\. Treat an asset or rig gap as a concrete implementation task or report a specific limitation; do not silently substitute an unrelated silhouette\.

The skull can be a stylised skull model with a separate jaw and simple eye sockets\. The demon needs a readable humanoid torso, arms and hands, and raven\-like feathered wings\. The zombies use one fixed, dedicated undead Cocopet design and rig across all casters and skill levels\. Their appearance does not depend on the casting pet’s species or evolution\.

Keep energy rings, rifts, auras, heart shapes, liquid pools, scythes, and meteor shells efficient through reusable meshes, simple curved strips, and shared materials\. Optimisation must preserve the real summon and attack counts\.

## Reference and progression assumptions

The request refers to “Golden Age” for Dead Scream\. This brief interprets that as the previously designed Golden Sun: an overhead source that deals periodic area damage for seven active seconds\. Reuse its general duration and area\-damage structure, replacing the sun with the requested skull\. Dead Scream’s skull follows above the casting pet, and its nearby damage area follows that pet\. If the actual project contains a separate Golden Age ability, inspect it and identify any difference rather than claiming an unverified match\.

Skill levels run from 1 to 7, with level 7 receiving the Celestial presentation, including for Dark skills\. The table preserves specified milestones\. Other intermediate values and values for the newly designed skills are proposed editable defaults\.

|Feature                                                |Lv. 1|Lv. 2|Lv. 3|Lv. 4|Lv. 5|Lv. 6|Lv. 7 Celestial|
|-------------------------------------------------------|----:|----:|----:|----:|----:|----:|--------------:|
|Dead Scream / active seconds, from reference assumption|7    |7    |7    |7    |7    |7    |7              |
|Umbra Heart / sustained seconds before burst           |7    |7.5  |8    |9    |10   |11   |12             |
|Final Eclipse / demons and main spheres                |1 + 1|1 + 1|1 + 1|1 + 1|1 + 1|1 + 1|1 + 1          |
|Doomsday / main meteors                                |1    |1    |1    |1    |1    |1    |1              |
|Thriller / zombie summons                              |3    |4    |5    |6    |7    |8    |10             |
|Thriller / normal combat duration in seconds           |30   |30   |30   |30   |30   |30   |30             |
|Thriller / each zombie’s normal-attack coefficient     |100% |100% |100% |100% |100% |100% |100%           |
|Annihilation / damaging rift cuts                      |3    |3    |4    |5    |5    |6    |7              |
|Requiem / floating scythes                             |1    |1    |2    |3    |3    |4    |5              |

Every damaging ability should gain total strength with level through its intended counts, damage coefficients, duration, or area\. Use existing game balance conventions for unspecified values\. Thriller is an explicit exception to any rule that normalises a whole ultimate into a fixed total damage budget: each zombie individually retains the full 100% normal\-attack coefficient\. Do not divide that damage by the number of zombies\.

Introduce visual upgrades progressively at intermediate levels\. Build richer shapes, motion, secondary layers, and timing rather than simply increasing brightness\. Maintain readable attack boundaries and valid target selection\. “Obliterates everything” describes spectacle; all damage must still pass through the game’s combat system rather than deleting actors\.

## 1\. Dead Scream

**Signature: a huge vibrating skull hovers above the pet and releases repeated pulses of dark energy into nearby enemies\.**

### Formation and model

A knot of dark smoke gathers above the pet\. A faint violet contour sketches the skull’s upper dome, then its cheekbones, sockets, and jaw become visible as the smoke thins\. Use a dark bone or obsidian\-like surface with subtle roughness, fine fissures, and restrained violet light within the eye sockets\.

The skull remains clearly separate from the existing pet model, hovering overhead as the pet moves\. Give it a steady main position with small controlled vibrations and a slow unsettling tilt\. Keep its large shape readable rather than shaking it randomly across the screen\.

### Pulses

Before each damage pulse, the jaw lowers slightly and light gathers behind the sockets and between the teeth\. The skull jolts once as it releases a broad ring of dark\-purple energy\. Thin jagged sparks scatter from its jaw and cheekbones while shadow particles drift downward into the attack area\.

Across the ground, a low violet ripple expands from beneath the pet\. The ripple and sparks visually communicate the pulse, while one shared damage event applies to enemies inside the configured nearby radius\. Let the skull’s glow recede between pulses so the attack has a distinct rhythm\.

### Evolution

**Level 1:** One large skull, dark sockets with violet interiors, visible jaw pulses, and a single clear ground aura\. Seven active seconds under the reference assumption\.

**Level 4:** A larger damage radius and stronger configured pulses\. Add branching surface fissures, a fragmented thin halo behind the skull, and two staggered decorative ground ripples per pulse\.

**Level 7 Celestial:** A monumental skull with layered shadow in its sockets and light travelling through the cracks in its surface\. Several broken halo segments rotate slowly behind it\. Each scream produces a thick, low dark\-energy wave followed by fine purple sparks and drifting ash\. At expiry, the jaw closes, the socket light draws inward, and the skull disintegrates into upward\-moving smoke and small dark fragments\.

### Mechanics

Use the referenced periodic area\-damage structure for seven active seconds\. A 0\.5\-second interval is a proposed fallback only if the source implementation has no established cadence\. The skull and aura follow the casting pet\. Do not add Fear, stun, or a separate finishing explosion without an explicit design change\. Decorative sparks do not each create their own full damage event\.

## 2\. Umbra Heart

**Signature: a massive three\-dimensional heart floats above the battlefield, dripping liquid shadow into a damaging pool before rupturing\.**

### Shape and shading

Use a thick, rounded heart\-symbol model, not an anatomical heart\. Give it a glossy near\-black surface, dark\-plum internal depth, and fine violet fissures\. Slow moving highlights reveal its rounded lobes and pointed base\. It beats through subtle, deliberate compression and expansion\.

The heart forms from several streams of shadow rising from the ground\. They join into its lower point, spread around its lobes, and close into the finished volume\. It hovers over the selected area, turning slowly while liquid darkness begins gathering along its lower edges\.

### Sustained damage

Thick shadow drops stretch into long strands before detaching\. Their landing points create expanding black\-violet ripples that merge into a large glistening pool\. Fine purple mist rises near the pool’s boundary, while small fragments drift upward toward the heart\.

Each beat briefly illuminates the heart’s internal cracks and the surface patterns beneath it\. Time the damaging pulses clearly against those visual beats\. The liquid should feel heavy and viscous, with varied droplet sizes and delayed trailing strands\.

### Final burst

During the last portion of the active window, the heart’s fissures widen and its liquid strands begin drawing inward\. At expiry, it contracts once, then bursts into curved pieces of dark glass, liquid shadow, and an expanding violet\-black shockwave\. The pool surges outward within the marked finishing area before its surface breaks into fading mist\.

### Evolution

**Level 1:** One massive heart sustains its shadow field for exactly 7 seconds, then produces one powerful finishing burst\.

**Level 4:** Proposed sustained duration: 9 seconds\. A larger heart and field, richer moving fissures, more varied liquid strands, and a stronger final rupture\.

**Level 7 Celestial:** Exactly 12 sustained seconds\. Layered currents move beneath the heart’s dark surface, with several independently travelling bands of violet cracks\. Large drops and fine streams fall together, creating overlapping ripples across a broad shadow pool\. Before the final burst, the inner light shows through widening fractures\. Its rupture produces the largest shockwave and a slow trailing falloff of dark fragments and purple mist\.

### Mechanics

Keep one heart at all levels\. It remains at its cast position\. Deal periodic Dark damage in the shadow field, then one separately budgeted major burst at the end\. The finishing hit must be significantly stronger than an individual periodic tick\. Droplets can visually signal the field damage but must not accidentally add uncontrolled frame\-by\-frame damage\. The 7/9/12\-second sustained windows exclude initial formation and harmless post\-burst decay\.

## 3\. Final Eclipse

**Signature: a raven\-winged demon drops from a black sphere, gathers power into that same sphere with raised hands, then hurls it into the battlefield\.**

### Sphere and entrance

A black sphere forms high above the target area\. Its surface contains slowly moving dark\-purple bands, a thin violet edge, and a few inward\-curling streams of shadow\. The lower surface opens like a vertical tear\.

The demon drops out of that opening\. Its wings are initially folded close to its body, then spread with a decisive downward beat that stops its fall beneath the sphere\. Black feather fragments drift from the wing tips\. Preserve the sequence of the existing sphere appearing first and the demon emerging from inside it\.

### Demon model

Use a readable humanoid torso, arms, and hands, with a dark faceted or cloth\-like surface, a restrained violet face or eye accent, and long feathered wings\. The wings must resemble raven wings, with overlapping tapered feather layers and articulated shoulder, mid\-wing, and tip movement\. Avoid substituting bat\-wing membranes\.

Reuse an appropriate rig where available\. Layer simple feather meshes along the wing supports, with smaller delayed movements toward the tips\. Preserve the raised\-hands pose and forceful throw even if the detail budget requires a stylised model\. The demon is an ultimate apparition, not an additional long\-lived AI companion\.

### Charge and throw

Hovering below the sphere, the demon raises both hands overhead\. Thin trails of violet light flow past its arms and into the sphere\. Shadow motes and loose fragments draw upward from the target area\. The sphere grows denser and larger while its inner currents accelerate\.

The demon pulls its shoulders back, braces its wings, then drives both arms downward in one powerful throwing motion\. The existing sphere tears free and plunges toward the ground\. Its surface stretches slightly with acceleration, leaving a broad smoky wake and fine violet streamers\.

At impact, the sphere compresses into a dark disc before releasing a huge low shockwave and a rising wall of violet\-black energy\. The demon’s wings fold inward and its body dissolves into black feathers and smoke above the aftermath\.

### Evolution

**Level 1:** One clearly animated demon emerges from the sphere, charges it, and hurls it down, producing one major Dark impact\.

**Level 4:** Larger sphere and impact area, more layered raven feathers, clearer hand\-to\-sphere energy streams, and greater wing follow\-through during the throw\.

**Level 7 Celestial:** A grand raven\-winged silhouette with multiple feather layers and fine violet seams across its dark body\. The sphere contains several counter\-moving currents and fragments orbiting just inside its outer shell\. The final raised\-hands pose holds briefly while the charge peaks\. Its forceful throw produces the largest impact, followed by an outward\-moving ring of dark fragments and a slow rain of dissolving black feathers\.

### Mechanics

Use one sphere impact damage event; the demon, charging particles, and departing feathers are decorative\. Preserve enemy and ground\-warning visibility during the short apparition sequence\. Use the normal gameplay camera and a finite cast timeline, approximately 3–4 seconds as an editable starting point\. Do not pause the rest of combat for a forced cinematic\.

## 4\. Doomsday

**Signature: one enormous meteor of dark energy plunges from the sky and detonates with a brief negative\-colour impact frame\.**

### Descent

A dark circular pressure mark forms on the target ground\. High above it, an irregular mass condenses from black energy and violet fractures\. Build the meteor from a compact faceted core with a few uneven shell sections and streaming shadow around it\. It should feel dense and heavy, with light buried inside its cracks\.

The meteor begins moving slowly enough to establish its size, then accelerates sharply\. Long dark trails tear from its rear, accompanied by purple sparks and small dissolving fragments\. Its leading surface becomes brighter along the fractures as it approaches the ground\.

### Impact

On contact, the meteor compresses briefly and the ground’s temporary fracture pattern spreads outward\. Trigger one short scene\-colour inversion at that exact impact\. Then return to the normal palette as a thick violet shockwave surges across the ground and a dark eruption rises from the centre\.

Use low ground mist, small temporary ground fragments, and energy cracks to sell the aftermath\. The central energy mass collapses into a dark mark, and the remaining particles drift outward before dissolving\. Keep a clear main impact rather than a long succession of indistinguishable flashes\.

### Evolution

**Level 1:** One giant dark meteor, one major impact, and one brief negative\-colour flash\.

**Level 4:** A larger, more fractured meteor with several broad trailing streams\. Increase configured damage and area, and enrich the expanding ground fractures and impact debris\.

**Level 7 Celestial:** One colossal meteor with visibly shifting shell pieces around its dark core\. Fine violet currents travel between the pieces during descent\. Its impact produces the widest low shockwave, a towering dark\-energy eruption, and a broad field of temporary glowing fractures\. The inversion still occurs only once at the main impact\.

### Mechanics and presentation

Use one deliberate major Dark AoE hit\. A large visual explosion must not bypass the game’s health or boss rules\. Keep all terrain changes temporary and preserve navigation\.

Implement the negative\-colour effect as a single brief scene\-only post\-process, about 0\.08 seconds as a tunable starting value, synchronised to impact\. Preserve HUD readability and restore normal colour immediately afterward\. Respect existing reduced\-flash settings with a restrained local impact alternative; do not build a repeating strobe\. Do not add secondary damage merely because several decorative shockwave layers are visible\.

## 5\. Thriller

**Signature: instances of one fixed undead Cocopet design rise from the ground, echo its attacks at full individual strength for thirty seconds, then rush enemies and explode\.**

### Zombie appearance

Create one dedicated undead Cocopet model with its own shared rig and animations\. Every Thriller summon uses this same design regardless of the casting pet\. Keep the same base silhouette at every skill level; higher levels increase summon count and enrich effects\.

Use a compact, hunched creature with a rounded head, short clawed limbs, ragged ears, and a stitched belly\. Give it dark\-grey and bruised\-purple surfaces, cracked details, dim violet eyes, and a slow purple pulse inside its torso\. Add sparse dark mist around its feet\. Offset animation timing and glow pulses between individuals without changing their fixed design\.

Give this model dedicated rise, idle, uneven walk, attack, sprint, and explosion animations\. Use these animations for every caster, including melee and ranged pets\. Only attack triggering and damage scaling refer to the caster; do not copy its appearance, rig, or animations at runtime\.

### Rising from the ground

Dark cracks and shallow shadow circles appear at valid summon positions around the caster\. The zombies rise through those temporary surfaces, with small ground fragments lifting around them\. Their limbs and distinctive features emerge in a short stagger, followed by their glowing eyes\. Once they are active, they spread into a loose formation and navigate alongside the pet\.

The emergence is visual and does not require digging permanent holes in the level\. Keep the summons targetable and mobile according to the game’s existing summon rules\. Do not replace the ten Celestial zombies with decorative ghosts that lack independent combat behaviour\.

### Exact combat behaviour

1. Spawn 3 zombies at level 1, 6 at level 4, and 10 at level 7\. Proposed intermediate counts appear in the progression table\.
2. The normal combat phase lasts exactly 30 seconds at every level, starting when the summon group becomes active after its short formation animation\.
3. Interpret “every time you attack” as the casting pet’s normal/basic attack action\. Every valid such attack triggers one corresponding Dark attack from each active zombie\. This is the proposed trigger interpretation; connect it to the actual game’s ownership and attack events rather than guessing a UI input\.
4. Each zombie individually uses 100% of the caster’s corresponding normal\-attack damage before target defenses, converted to Dark elemental damage\. Use the caster’s current offensive values when the attack is triggered\. Apply the normal target defenses and the game’s attack rules once\. Different target resistances can make final HP damage differ from the caster’s original element\.
5. Do not divide the 100% coefficient by summon count or normalise the army to one pet’s total damage\. Ten zombies represent ten additional full\-strength attack contributions when they all connect\.
6. Zombies acquire valid enemies, navigate into range, and perform their attacks using their own animation and targeting\. They can share the caster’s target or choose a valid nearby target if it dies\. Small visual timing offsets may make the group readable, but do not reduce the number of attacks that can successfully execute\.
7. Trigger from one authoritative normal\-attack action ID, not every animation frame, projectile contact, or damage\-over\-time tick\. A multi\-hit normal attack must use the existing action’s intended total damage rather than duplicating that total for every sub\-hit\.
8. Do not copy the caster’s ultimate casts, spawn more Thriller armies, or let zombie damage recursively trigger another full round of zombie attacks\. Attribute their damage to the caster for ordinary party and ownership systems\.
9. Use normal summon health, navigation, and targeting conventions where they already exist\. Expose unspecified summon durability and timing values as tuning data rather than inventing hidden immortal or disposable behaviour\.

### Expiry charge and explosions

At the end of the 30\-second combat phase, surviving zombies stop their ordinary attacks and enter a final rush\. Their internal cracks brighten, purple energy gathers in their torsos, and their movement changes from the uneven combat gait into a direct sprint toward a valid enemy\.

Each zombie detonates once on reaching its final target, producing a substantial Dark AoE explosion\. Its model breaks into smoky fragments and violet sparks, followed by a short expanding shadow ring\. Give the army’s explosions a natural stagger based on arrival, rather than forcing every summon to vanish on the same frame\.

Use a bounded final approach window, such as 2 seconds after the normal 30\-second phase, so unreachable targets do not leave permanent summons\. If a target becomes unreachable, use a valid reachable endpoint; if no enemy remains, dissolve harmlessly\. Each summon can detonate at most once\. Zombies defeated earlier follow the existing summon death rules and do not get an unrequested duplicate expiry explosion\.

### Evolution

**Level 1:** Three detailed undead Cocopets, each with full individual attack strength, remain in normal combat for 30 seconds before the final rush\.

**Level 4:** Six undead Cocopets\. Add more varied damaged surfaces, better\-defined emissive seams, richer emergence effects, and clearer dark trails on attacks\. Preserve each zombie’s 100% coefficient and 30\-second combat phase\.

**Level 7 Celestial:** Ten instances of the same fixed undead Cocopet design, with richer dark surface shading and restrained violet pulses inside their bodies\. Their coordinated attack commands produce an imposing army without exact visual synchronisation\. At expiry, their fractures brighten in a rolling sequence before they sprint and detonate\. Preserve full individual damage and the exact 30\-second normal combat duration\.

### Performance

Share suitable meshes, textures, materials, animation data, and collision conventions, while preserving all real actors\. Use sensible distant detail levels and sparse smoke\. Never optimise away required zombies, silently reduce their damage coefficient, or leave stale AI and attack listeners after they expire\.

## 6\. Annihilation

**Signature: enormous intersecting rifts tear through the battlefield, hold open as black wounds in the air, then collapse into one devastating void burst\.**

### Gathering

A thin, fractured violet seal appears across the targeted ground\. Nearby shadow particles pull toward its centre, and a narrow black diamond of energy forms briefly above it\. The diamond stretches into a sharp line as the pet commits the cast\.

### Rift cuts

Long violet seams slice through the target area from different angles\. Each starts as a hairline, then snaps open into a broad, dark cut with irregular luminous edges\. Use layered ribbon planes and restrained distortion to suggest an opening in space\. The interior is almost black, with slow purple currents and particles disappearing into its depth\.

Each rift sweeps along a defined path at a height and width that clearly intersects its intended targets\. At enemy contact, small dark fragments peel away toward the seam\. Its bright edge sharpens briefly, then dims as that cut finishes\. The completed rifts remain visible for a short hold, forming an intersecting pattern of torn space\.

### Collapse

After the last cut, hold the pattern just long enough to read it\. All rift edges then pull inward toward the centre, as if the battlefield’s shadow is being drawn tight\. The cuts snap closed in a rapid sequence and release one broad, low violet\-black shockwave\.

Let the shockwave carry thin angular fragments and a rolling sheet of dark mist\. The remaining seams fade from their outer ends toward the centre, leaving a few dim purple motes\. The illusion affects the spell geometry only, not the actual scene topology\.

### Evolution

**Level 1:** Three major rift cuts cross the target area, followed by one substantial closing burst\.

**Level 4:** Five cuts approach from more varied angles\. Give the rifts layered edges, clearer interior currents, and longer trailing particles\. The closing burst covers a wider defined area\.

**Level 7 Celestial:** Seven immense rifts sweep through the battlefield in an accelerating sequence\. Their edges carry thin branching violet fractures, and dark fragments appear suspended between the cuts\. During the closing beat, every seam draws toward the centre, then collapses into the strongest final void burst\. The pattern dissolves in a deliberate inward\-moving sequence rather than disappearing all at once\.

### Mechanics

These counts are proposed design values\. Each rift has one controlled cut event per target, and the collapse is one separately budgeted major AoE hit\. Use collision paths that match the visible cuts and a clear boundary for the final burst\. Do not let overlapping visual layers of the same rift create duplicate hits\. Suggested total sequence: approximately 3 seconds\. No automatic instant\-kill or permanent destruction flag\.

## 7\. Requiem — physical gothic scythes

**Signature: enormous, solid gothic scythes emerge from dark portals and reap the battlefield with heavy, deliberate swings\. Their weapons are physical three\-dimensional objects; dark magic animates them and follows their blades\.**

### Physical model and proportions

Create a complete scythe asset that still looks detailed with all glow and particles disabled\. Use the same shared asset for the 1/3/5 scythe progression, with appropriate material and effect upgrades\. No wielder is required\.

As a starting proportion, make the shaft about three times the casting pet’s body height and the blade’s outward reach about one and a half times that height, clamped to sensible combat dimensions\. Keep the long shaft, substantial metal head, and single sweeping pointed blade immediately recognisable\.

Build the blade as a closed volumetric mesh\. Give it a thick reinforced spine near the mounting socket, a broad curved body, and a long taper toward its hooked tip\. The inside curve is the sharpened cutting edge\. Model the front, back, underside, spine, and bevels so the blade retains thickness when it turns edge\-on\. Use a clean silhouette with a few small wear chips rather than excessive spikes\.

Mount the blade to the shaft through a substantial forged\-steel socket with visible overlapping plates, raised reinforcing ribs, rivets, and bolts\. Add restrained pointed\-arch ornament around the socket and recessed geometric engravings near the blade root\. The construction must visibly support the large blade\.

The shaft is slightly bowed blackened wood with visible grain and shallow surface damage\. Place two worn leather grip sections at different heights, with overlapping wrap seams, edge wear, and metal bands securing their ends\. Add a weighted steel end cap and small engraved collars\. Keep all components attached with believable contact and no floating decorative pieces\.

### Materials and shading

Give the main blade dark, blackened steel with subtle purple reflections, brushed surface detail, fine scratches, and varied roughness\. Its sharpened bevel is exposed gunmetal silver that catches a clear moving highlight during each swing\. Rivet heads and raised edges have more polish; recessed areas remain darker and rougher\.

Keep wood, leather, and metal visibly different in roughness and shading\. Use charcoal\-brown leather, dark wood grain, and cold steel reflections\. Fit the game’s stylised rendering while preserving these material differences\.

Use dark purple `#180B2E` and deep plum `#2B0B45` in the weapon’s shadowed finish, with `#6D28A8` energy inside its recessed engravings\. Reserve `#A55CFF` for small charged accents\. The broad metal surfaces remain shaded, opaque, and physical\. Keep glow narrow enough to reveal the engraved grooves and steel beneath it\.

Use textures or supported procedural materials for fine scratches, grain, and roughness\. Put silhouette changes, blade thickness, bevels, raised fittings, and leather\-wrap relief into geometry at an appropriate detail level\.

### Entrance and animation

A dark portal opens above the target area\. The complete scythe emerges from it as one rigid weapon, its metal catching violet light from the portal rim\. It tilts forward and pauses with its blade poised to strike\. Small ash particles drift from the portal rather than hiding the weapon\.

Each attack has a visible windup, fast cutting phase, and weighted follow\-through\. Rotate the entire scythe around a controlled pivot near its grip region while translating it along a clear attack path\. The heavy head leads the downward arc, the shaft follows as a rigid structure, and the weapon decelerates after passing through its target area\. Add a very small settling vibration to the fittings if useful, without bending the steel or making the shaft rubbery\.

A narrow silver highlight runs across the bevel during the fastest movement\. Behind the physical blade, leave a translucent dark\-purple crescent and a thinner violet trail\. The trail follows the blade’s actual path and fades quickly enough that the solid scythe remains the main visible object\. Contacts release brief purple sparks and drifting dark fragments\.

After its final sweep, the scythe slows, turns, and retreats into its portal\. Keep its material and solid form intact until it crosses the portal boundary\. The portal then closes and the remaining crescent trails fade\.

### Evolution

**Level 1:** One fully modelled physical scythe performs a short sequence of sweeping cuts\. Include complete blade thickness, fittings, shaft materials, and leather grips from this first tier\.

**Level 4:** Three physical scythes attack from staggered positions\. Increase the visibility of charged engravings and add richer trailing shadows while preserving the metal, wood, and leather surfaces\.

**Level 7 Celestial:** Five enormous physical scythes form a loose rotating arrangement around the enemies\. Their engravings illuminate sequentially before the weapons enter offset sweeping paths\. The final cuts travel around the formation, leaving interlacing purple afterimages behind clearly visible steel blades\. All five weapons withdraw intact into their dark portals\.

### Mechanics and verification

Retain the proposed 1/3/5 counts and three scheduled damaging sweeps per scythe over an approximately four\-second sequence\. Use each physical blade’s swept volume for damage, with one hit per target per sweep\. The decorative crescent trails do not add separate hits\.

Inspect the model with emission disabled under neutral lighting, then from the normal gameplay camera during a complete cast\. Verify visible blade thickness, clean bevel highlights, distinct material surfaces, attached fittings, convincing swing weight, readable attack paths, and complete portal withdrawal\. All attacks still deal Dark elemental damage\.

## Implementation and review

Separate gameplay timers, attack IDs, hit rules, damage, summon state, and expiry logic from particle density and rendering frame rate\. Pool reusable effects and share materials where suitable\. Keep dark transparency readable and avoid excessive overlapping smoke or unrestricted dynamic lights\.

At lower graphics settings, reduce small particles, dense smoke, extra lights, and minor model details while preserving required character forms, actual summon counts, real attack events, and exact durations\. Final Eclipse must retain its demon and raised\-hands throw\. Thriller must retain its real army and per\-zombie coefficient\.

Expose all seven skill levels and previews for levels 1, 4, and 7 using the actual gameplay camera\. Verify:

- Dead Scream’s assumed reference, seven\-second active duration, following skull, and shared pulse damage events\.
- Umbra Heart’s seven\-second level\-1 window, twelve\-second Celestial window, periodic damage, and single finishing burst\.
- Final Eclipse’s exact visual order: sphere appears, demon emerges, wings open, hands rise, the same sphere charges, arms throw it down, impact resolves, apparition disappears\.
- Doomsday’s one meteor, one main damage event, and one bounded negative\-colour impact effect that correctly restores the scene\.
- Thriller’s 3/6/10 counts, 30\-second normal combat phase, 100% per\-zombie coefficient, owner\-attack triggers, no recursive summoning, and bounded once\-only expiry explosions\.
- Thriller with melee and ranged casters, multi\-hit attacks, a single boss, defeated targets, blocked routes, no remaining enemies, early summon defeat, and repeated casts\. Confirm that every real summon cleans up its AI, listeners, and effects\.
- Annihilation’s 3/5/7 rift cuts plus one closing burst and Requiem’s 1/3/5 scythes with explicit sweep hit rules\.
- Clear behaviour for crowds, no targets, moving actors, nearby walls, interrupted casts, overlapping party effects, and lower graphics settings\.
- Correct shading and animation throughout each effect: visible dark forms, clean silhouettes, moving highlights, readable spell boundaries, purposeful particle motion, and complete decay\.

Report actual changes, preview controls, the reference assumption used for Dead Scream, and any specific model or renderer limitations\. The finished set should feel dark, gothic, detailed, and powerful, with every ultimate recognisable through its shape and motion before its brightest impact\.