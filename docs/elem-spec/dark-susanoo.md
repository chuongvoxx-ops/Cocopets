Susano O — Dark Ultimate No. 11
Claude implementation prompt
Implement Susano O, the 11th Dark-element ultimate, in my existing Cocopets game. The pet summons and pilots an enormous armoured robot from a visible cockpit at the centre of its torso. Susano O glides swiftly across the battlefield, swings a giant sword, releases waves of darkness and erupts obsidian formations from the ground. The robot's ultimate-slot command is now Transform. Activating it physically converts Susano O into a playable airship, then changes the command menu again. The airship uses Dive instead of Dodge and has exactly one strong attack, Shockwave Pulsar. Its ultimate is Dark Messiah, preserving the original concentrated dark-energy beam, colossal explosion and safe pet return.

Use the supplied two-form Susano O / Dark Messiah concept sheet as the current visual target: the upper panel shows the robot and the lower panel shows its transformed spacecraft. Preserve the dark samurai silhouette, sweeping engraved blade wings, central pet cockpit, ornate armour and giant sword. Retain the earlier Optimus-inspired layered mechanical construction, broad shoulders and articulated joints while following the connected folding layout below. Match the modelling, material, texture, shading and animation quality of Beast Machine and Sports Car. Build the spacecraft by physically rearranging the same robot components.

Inspect the existing project first, including Beast Machine, Sports Car, the temporary-control system, the damage-to-finisher meter and the Earth ultimate Crown of Rock. Adapt this implementation to the actual engine and existing combat architecture. Register Susano O as the eleventh Dark ultimate using a stable unique identifier; roster position must not overwrite another skill's ID or saved data. Deliver both playable forms, their connected transformation, context-sensitive menus, animations, attacks, effects, sound and restoration behaviour.
1. Appearance and central pet cockpit
Susano O is a towering mechanical dark samurai with a broad, angular chest, powerful arms, articulated legs and two magnificent fans of metallic blades spreading from its back. Obsidian armour overlaps a visible steel skeleton. Antique-gold ribs frame the torso, crimson bindings wrap the shoulder assemblies, and violet energy glows deep inside the joints. Its crested helmet has a layered mechanical faceplate and narrow luminous eyes. Behind the armour, pistons compress, gears turn and cables flex as the machine moves. It carries one enormous sword, with a thick black-metal blade, silver cutting edges and a recessed channel of violet darkness.

Keep broad shoulder assemblies, layered chest panels, exposed machinery, convincing hip and knee joints and substantial mechanical hands. Mount two large cylindrical thruster pods on the upper back, with dark ribbed casings, antique-gold collars and violet exhaust. These exact two pods power the spacecraft; the legs do not manufacture new engines.

Use predominantly obsidian, gunmetal, silver and aged gold, with restrained crimson enamel and violet energy. Keep the design cohesive with Cocopets and the earlier Susano O artwork.

Place the actual pet model in the centre of the robot's torso, secured in a recessed pilot cradle. Use the concept sheet's open, gold-framed armour ribs so the pet's face and upper body remain visible from the normal gameplay camera. Preserve this same cockpit frame in spacecraft mode rather than replacing it with an unrelated vehicle cabin. Keep the cockpit large enough to read at that distance. The pet remains the pilot throughout the ability.

Give the pet two visible controls or floating control rings. Its gestures correspond to the robot's actions: leaning into turns, bracing for a sword slam and pulling the controls inward before transformation. Connect the cockpit to the robot with subtle energy conduits. Keep the pet securely attached during spins and transformation, with intentional piloting animation rather than uncontrolled physics.

The blade wings are assemblies of individually shaped, engraved metal blades with real thickness and staggered spacing. Their mounting hubs rotate and their blades fold to accommodate movement. Keep them recognisable as part of Susano O in both robot and airship form.

Preserve the earlier optimisation requirement: one substantial metal rear half-skirt, covering only the back of the hips, with the front open so both mechanical legs remain visible. Represent decoration with shaping, engraving and surface detail instead of numerous independently moving skirt strips. This same rigid panel hinges into the spacecraft's dorsal rear cowling. Crimson bindings stay on their original shoulder housings; secure small tassels clear of joints and exhausts.

The giant sword needs a substantial hilt, articulated hand grips, a sculpted guard and a dimensional blade. Support one-handed sweeping poses and a convincing two-handed grip for both strong attacks. Hands must remain on their correct grip points throughout the animations.
2. Required visual fidelity
Treat Beast Machine and Sports Car as the minimum quality benchmark. Compare Susano O against them under equivalent lighting and at the normal battle-camera distance.
- Build curved and bevelled armour shells, recessed panel seams, layered shoulder pieces, visible joint cavities, piston rods, cable bundles and articulated fingers. Important silhouette details must be geometry.
- Use distinct materials for polished edges, brushed steel, black lacquer, aged gold, braided bindings and cockpit glass. Give each appropriate reflectivity, roughness and surface detail.
- Add fine machining marks, restrained scratches, engraved decoration, worn edges and subtle grime inside recesses. Maintain clear large forms beneath the detail.
- Use the renderer's supported physically based or equivalent material response, normal detail, contact shadows, environmental reflections and ambient occlusion where available. Dark armour must retain readable highlights and volume.
- Keep violet emission concentrated in cores, vents, sword channels and seams. Metallic armour must remain visibly metallic during attacks.
- Build effects in layers: a distinct core, dimensional energy surfaces, textured smoke, fine particles and a controlled fade. Use depth-aware intersections where supported.
- Make the complete robot attractive with combat effects turned off. Its quality must come from the model, materials and animation as well as the spectacle.
Use the project's supported rendering features and assets. Where a requested feature requires an approximation, implement the strongest supported equivalent and identify the limitation accurately.
3. Summoning and temporary controls
A dark circular seal opens beneath the pet. The central cockpit rises around it first, keeping the pet visible. Mechanical ribs, spine sections, limbs and armour slide into place in a rapid assembly sequence. Shoulder engines unfold, blade wings fan outward, and the helmet locks into position. The giant sword assembles from solid interlocking sections threaded with violet energy. Finish with a resonant mechanical lock and a brief pulse from the cockpit core.

Keep the summon brief and readable. Start the active-form timer when the robot becomes controllable.
Normal control	Robot form	Airship form
Movement	Ground-following glide with 35% increased movement speed	Player-controlled aerial movement
Dodge	Glides	Dive
Strong attack slot 1	True Dark Blade	Shockwave Pulsar
Strong attack slot 2	Dark Spikes	Hidden and unavailable
Ultimate	Transform	Dark Messiah meter, then finisher activation


The airship has exactly one strong attack. Collapse the unused second strong-attack button and disable its keyboard/controller action while airborne. Do not duplicate Shockwave Pulsar into both slots or leave Dark Spikes accessible through a hidden binding.

Transform must finish its connected folding animation before changing the authoritative form, installing the airship menu and returning control. Do not immediately fire Dark Messiah after the transformation. Require a fresh press for the later finisher, so holding the Transform input cannot automatically trigger it.

Apply the existing movement modifier once through the stat system: normal calculated movement speed multiplied by 1.35, subject to established movement rules. Carry that single Susano O modifier across the session by default, including the airship phase; do not multiply it again on Transform. Remove only this session's modifier on final exit, preserving unrelated buffs and debuffs. Keep aerial movement tuning in the project's flight configuration.

Show distinct icons for Glides, True Dark Blade, Dark Spikes and Transform in robot form, then Dive, Shockwave Pulsar and Dark Messiah in airship form. Use black, silver and violet accents with readable labels and cooldowns. Display the current phase's remaining time separately from finisher charge: 35 seconds for robot form, then a fresh 20 seconds for airship form. In robot form, a secondary Dark Messiah charge indicator may remain visible, but the ultimate button's action and label must be Transform.

Required Susano O timing — these explicit values supersede the earlier inherited duration and cooldown defaults:
Setting	Required value	Timing rule
Robot phase	35 seconds	Starts when the robot becomes controllable
Airship phase	20 additional seconds	Starts fresh when Transform finishes and flight control returns
Susano O outer ultimate cooldown	4 minutes / 240 seconds	Starts once on final session exit, when normal control returns


The two forms allow up to 55 seconds of controllable form time when the full robot phase is used before entering the airship. Summoning, the finite folding animation and an already committed Dark Messiah cinematic are separate from this active-control budget. No level-based change to these durations has been specified.

Using Transform early ends the robot phase and starts the separate 20-second airship phase after the animation; unused robot time is not banked or added to those 20 seconds. Dark Messiah can end the airship phase early. Keep the form change manual through Transform; the robot's timer expiring without a valid Transform request uses the safe timeout exit.

Use two phase timers inside one summon session. Stop the robot timer when Transform is validly committed, then grant the 20-second airship timer exactly once at successful handover. Repeated inputs, interrupted callbacks or menu refreshes must not restart or extend either timer.

Use the existing dodge cadence as the starting cooldown for Glides and Dive. Keep robot strong attacks and Shockwave Pulsar in the established ability tuning system. No new cooldown, damage coefficient, ray duration or hit-count progression has been specified for the airship attacks; use configurable initial values and report them. Preserve existing level-based damage scaling.
4. Movement and Glides
During ordinary movement, Susano O floats just above the ground, propelled by restrained violet exhaust beneath its feet and rear engine housings. It leans into acceleration, banks through turns and draws its blade wings closer during sharp manoeuvres. Give it responsive movement with convincing mass and a clear ground shadow.

Use ground-following traversal in robot form, including existing handling of slopes and arena edges. After Transform, switch to the playable airship flight described below. Keep both forms within their respective permitted traversal spaces.

Pressing Glides sends Susano O into a rapid spinning glide along the input direction. The pet visibly initiates the motion from the central cockpit. The robot extends its giant sword, turns through a sweeping rotation and carries that sweep along its travel path, damaging enemies caught by the blade.

Animate a short preparation, committed rotating sweep and controlled recovery. Give the player bounded steering during travel. Let the wings fold slightly so the main sword remains the focus, and keep the camera stable as the robot spins.

Create a broad crescent trail following the actual sword edge: a bright silver-violet leading edge, a translucent purple body and a soft smoky inner fade. Add brief sparks at real enemy contacts and a thin ground wake beneath the machine. Trails must follow the weapon's motion in three dimensions.

Use swept weapon collision or the engine's equivalent so the fast-moving sword reliably hits targets. Each enemy takes one Glides damage event per activation. Decorative wing blades, trailing particles and overlapping robot colliders must not duplicate that hit. Ordinary movement alone does not create continuous contact damage.

Allow another Glides only after the current action's recovery and configured cooldown. Preserve the existing dodge protection window where applicable, without extending it to the entire transformation. Respect walls, boss collision and displacement resistance.

If the form supports the existing basic-attack input, route it through a simple robot sword swing using the established attack cadence and damage system. Suppress the hidden pet's original attack animations and projectiles while it is piloting.
5. True Dark Blade — Strong attack slot 1
Susano O takes its giant sword in both hands, lifts it overhead and slams the cutting edge into the ground, releasing an enormous wave of darkness across the battlefield.

Make the action read clearly: elbows rise, shoulders rotate, the spine arches, and the pet braces inside the cockpit. Violet energy climbs the sword's central channel. On the downswing, the torso and arms drive the weapon into the strike, with a heavy mechanical recoil on impact.

The impact launches a broad travelling wave forward through the aimed area. Give it a towering curved face of dark energy, a sharply illuminated violet rim, smoky black internal motion and small fragments drawn along its surface. Ground fissures illuminate beneath its leading edge, then fade behind it.

The wave must visibly travel through enemies. Match damage timing and collision to its moving front, with one hit per enemy per activation. Treat the immediate blade impact and the outgoing wave as parts of the same attack for hit tracking, so a nearby enemy is not accidentally hit twice by overlapping representations.

Make the attack wide and powerful while keeping its boundaries readable. Follow the project's obstacle and arena rules. Damage, wave width, travel range, propagation speed and cooldown remain configurable. Fade temporary ground marks and debris after the wave passes.
6. Dark Spikes — Strong attack slot 2
Susano O grips the sword with both hands, turns its point downward and drives it vertically into the ground. Darkness races beneath the battlefield, then giant obsidian formations burst upward and erupt with dark energy.

This must be visually distinct from True Dark Blade: a deliberate point-first impalement followed by upward eruptions, rather than an overhead cleaving swing followed by a travelling wave.

Reuse the existing Earth ultimate Crown of Rock's actual rock model and eruption effects. Locate its asset references, mesh or geometry generator, animation, formation layout, ground-crack effect, debris and particle systems in the project. Reuse or parameterise those components for Dark Spikes.

Create a Dark material and effect variant with glossy black obsidian, sharp silver-purple highlights, violet fissures, black mist and dark-energy bursts. Preserve the original formation's model detail and eruption choreography. Use separate material instances or configuration so Crown of Rock retains its existing Earth appearance and behaviour.

As the sword enters the ground, send dark fissures toward the selected attack area. Let the reused formations punch upward with visible mass, scattering chips and displacing dust. Violet light builds inside their cracks before the formations release their dark burst and settle, crumble or dissolve using the established effect lifecycle.

Use two deliberate damage phases as the starting presentation: one eruption hit and one subsequent dark burst per enemy within the corresponding area. Track hits across the whole formation for each phase; overlapping rocks and particles must not multiply the damage. Tune the phases as a transformed strong attack rather than inheriting Crown of Rock's ultimate damage automatically. Both phases deal Dark damage.

Keep the formations temporary and preserve navigation. Follow the original skill's validated placement rules and keep effects within permitted battlefield space.

If the exact Crown of Rock implementation cannot be found, identify the missing dependency precisely. Continue independent work on Susano O and report the reuse limitation; do not claim an exact match or silently substitute an unrelated Earth ultimate.
7. Transform availability and shared Dark Messiah charge
Use one continuous Dark Messiah meter for the Susano O session. Start it empty when the robot becomes controllable and retain it when the player uses Transform.

Implementation default for the unspecified charge rule: Transform is a form-change command available once the robot is controllable and its current action permits it. It does not require or consume Dark Messiah charge. Do not impose two full charge cycles unless a later explicit design requires that. The robot can build charge before transforming, and the playable airship can continue building the same meter.

Charge from actual enemy damage belonging to this session: robot sword attacks, Glides, True Dark Blade, Dark Spikes, airship Dive and Shockwave Pulsar. Count resolved effective damage once, after mitigation and excluding overkill. Misses, invulnerable targets, scenery, allies and decorative effects grant no charge.

In robot form the ultimate-slot action remains Transform, even if the shared meter is full. Dark Messiah is available only in airship form. Once the airship's meter is full, display DARK MESSIAH with the existing ready pulse. The player activates it manually.

Transform itself grants no damage or charge. It does not spend the session's one permitted finisher. Dark Messiah consumes the full meter and ends the summon through its original beam/explosion/return sequence. Its damage cannot refill the meter.

Use a one-way progression for this version: robot → Transform → playable airship → Dark Messiah or safe timeout. No reverse-transform command has been requested.

During Transform, temporarily lock commands and ignore repeated activations. Queue or defer entry only to a valid robot recovery pose. Update the menu once, on successful completion. Require input release and a fresh press before accepting Dark Messiah or another airborne action.
8. Transform — Connected mechanical change into playable airship
Transform is a distinct robot-form command, not the Dark Messiah attack. Its sequence is robot → connected mechanical transformation → completed airship → new command menu → player-controlled flight. It ends by handing control back to the player, not by charging or firing a beam.

On activation, validate a safe transition and airborne position, then briefly disable ordinary robot attacks and Glides. Preserve current charge, HP and ability cooldown records. End the robot phase on valid commitment, then start its separate 20-second airship timer only after successful handover. If the sword is still planted by Dark Spikes or recovering from True Dark Blade, withdraw it through a valid recovery pose before lifting the robot. Do not teleport the blade into the aircraft. No damage-target selection is required for this non-damaging form change.
A. Spacecraft appearance
Build a broad, low blade-winged dark attack spacecraft matching the lower concept panel. It has a pointed central prow, an open pet cockpit on the forward upper deck, two broad swept blade fans, two armoured rear booms and the original violet thruster pods at their aft ends.

Preserve the obsidian, gunmetal, silver engraving, antique gold, crimson bindings and violet energy palette. Repeat the same conspicuous panel motifs, wear patterns, shoulder rings and joints in both forms.

The gold-framed chest becomes the forward command deck. The actual pet remains visible in the same cockpit cradle. The helmet folds ahead of and below the cockpit as the prow; its crest, horns and faceplate stay recognisable.

The circular shoulder and wing-root assemblies sit beside the cockpit, retaining their crimson rope wraps. The engraved blade fans rotate into a predominantly horizontal plane and sweep backward into crescent-like wings. Maintain each blade's original curvature, thickness, silver pattern and violet edge. Preserve the same authored blade count on each side across both forms.

The arms pack alongside the forward hull. Their elbow blocks, forearm armour and hands remain recognisable around the weapon cradle. The entire giant sword remains intact, projecting beneath and ahead of the central hull. Its silver cutting edges, gold guard, crimson grip and violet channel become the craft's strongest forward feature.

The sword is the airship's existing energy focus for Shockwave Pulsar and Dark Messiah. Its original channel guides energy toward the point. It must remain a recognisable charged sword, not become an unrelated tubular gun or disappear inside a newly invented cannon.

The legs form two rear booms with visible thigh armour, knee housings and nested shin plates. The same two backpack engines dock along these assemblies, with exhaust pointing aft. Feet rotate into compact stabilising surfaces; they do not become extra engines.

The single rear half-skirt hinges into a substantial dorsal cowling over the rear machinery. Retain openings around its sides so the folded joints and engine mounts remain readable.

The deployed wings and long sword give the craft an imposing footprint. Preserve actual component dimensions; do not enlarge the model arbitrarily or invent hull sections to fill gaps.
B. Component map
Build both forms from one persistent collection of meshes and an explicit shared rig.
Robot component	Connected movement	Spacecraft role
Torso and spine	Pitch into a horizontal posture; attached panels rotate into place	Main fuselage
Chest cockpit and pilot seat	Stay attached; internal cradle counter-rotates	Upright forward command deck
Helmet and neck	Fold forward/down into a matching recess	Armoured prow beneath the cockpit
Shoulder rings and blade-fan roots	Rotate on substantial hinges into the flight plane	Structural wing mounts
Individual engraved blades	Sweep aft on their existing spars	Broad crescent wings
Upper arms and forearms	Draw inward and fold beside the forward hull	Side structure and weapon supports
Hands	Reposition visibly onto hilt/guard locking points	Clamps around the sword cradle
Giant sword	Dock intact to an attached centreline cradle	Forward dark-energy focusing weapon
Thighs, knees and shins	Fold rearward and nest together	Two armoured aft booms
Feet	Rotate flat against the rear assemblies	Compact stabilisers
Two backpack thrusters	Swing aft on attached articulated rail arms and latch to the booms	Rear propulsion pods
One-piece rear half-skirt	Hinge upward from its waist mounting	Dorsal rear cowling
Crimson bindings and tassels	Remain on their housings; loose ends secure into clips	Ornament clear of moving mechanisms


The thruster support arms must already exist on the robot. The sword cradle must already exist folded against its lower torso. Do not materialise these mechanisms only after transformation starts.

Armour opens to expose machinery and closes onto defined stops, but remains connected throughout. Use captive rails, pivots and sockets rather than floating panels.
C. Ordered transformation choreography
Build mechanically compatible intermediate poses. Stages may overlap only when their clearance permits it.
1. Prepare and lift. Centre the sword, brace the pet and draw the wing fans into a clearance pose. The existing thrusters lift the robot above the battlefield. Transition its ground-following collision into the airship's flight handling, with player input temporarily locked only for the folding animation.
2. Dock the sword. Unfold the centreline cradle from the lower torso. Guide the hilt and guard into it using the existing arms and hands. Close structural clamps with a visible lock. Keep the hands on defined contact points, or show them releasing and regripping only after the cradle supports the sword. Never drop, duplicate or teleport the weapon.
3. Open the folding clearances. Lift the necessary attached chest, waist and rear plates to expose spine pivots and limb-stowage paths. Raise the single rear half-skirt clear of the legs. Preserve all panel connections.
4. Pitch the torso. Rotate the body into a horizontal flight posture, with the chest becoming the upper forward deck and the pelvis trailing behind. Counter-rotate the cockpit's internal cradle throughout, keeping the pilot upright and the controls reachable inside the same chest frame.
5. Stow the helmet and arms. Fold the helmet into the prow recess below the cockpit. Pack shoulders and elbows into their aircraft poses. The folded forearms line the forward fuselage and reinforce the docked sword. Keep every hand, wrist and finger accounted for, with believable grip or clamp contact.
6. Deploy the blade wings. Rotate both fan roots into the horizontal flight plane. Sweep their individual blades aft on the existing spars, creating the overlapping feather arrangement. Keep sufficient spacing to avoid blade intersections. The crimson wraps remain visible on the original root drums.
7. Form the rear booms. Rotate the hips rearward, fold the knees and nest each shin against its corresponding thigh. Use only existing nested/sliding sections where required. Rotate the feet flat into their stabiliser positions. The two assemblies cannot pass through each other or through the cockpit.
8. Relocate the existing thrusters. Swing the two original backpack pods aft on their connected support arms. Give the paths clearance from the wings, rider and armour. Align the nozzles rearward and lock each pod to its folded-leg support. Never detach them to conceal an impossible movement.
9. Close and latch. Lower the one-piece rear half-skirt into its dorsal cowling position after the legs and engine mounts are seated. Close other armour onto defined stops. Secure loose tassels. Confirm the sword, wing and engine locks with mechanical clicks and restrained violet status pulses.
10. Establish flight and hand over control. Hold the completed spacecraft silhouette briefly, level into a safe airborne pose and stabilise the camera. Set the completed airship state, replace the menu with Dive, one Shockwave Pulsar button and Dark Messiah, and return movement control. Do not select a target, consume charge or auto-fire a finisher during this step.
Keep this sequence finite and responsive, with timings in animation data. Show the physical transformation without hiding its whole duration inside a flash, dense smoke or a camera cut.
D. Rig construction and clearance checks
Create named robot, clearance, intermediate and spacecraft poses for the main assemblies. Share the same source meshes, materials and ownership across both completed forms.

Use proper local pivots at the neck, spine, wing roots, shoulders, wrists, hips, knees, engine mounts and rear cowling. Telescoping parts need visible nested segments and travel limits; solid metal cannot stretch to reach a target.

Do not split the giant sword into separate emitter rails. Its complete blade, guard and grip remain intact throughout. The original violet groove and tip supply the magical beam-focusing function.

Use the engine's supported pose constraints or authored matching poses so hands meet their actual grip points. Avoid floating fingers, palms inside the guard and forearm plates crossing the weapon.

The cockpit needs enough space for the seat to counter-rotate without crossing its ribs. Keep the same live pet entity continuously attached. Stabilise the camera independently of the chassis pitching and banking.

Do not give folded wing blades, hands or moving thrusters accidental contact-damage hitboxes during transformation. Use the intended transition collision, then activate the playable airship collider and retain a valid safe-return position.

Inspect the complete transition from front, side, above and the normal combat camera. Check the paths of the sword, helmet horns, blade tips, thrusters, feet and rear half-skirt. Resolve spatial conflicts in the working rig; the concept art is a visual target, not proof that every joint already fits.

Cancellation must work at any intermediate pose. Stop future attack events and use the existing safe-return or defeat path without requiring all panels to finish moving first.
9. Playable airship movement and command menu
The completed airship is a real controllable combat phase lasting 20 additional seconds, starting when the player receives flight control, or ending earlier if the player uses Dark Messiah. This time is added after robot form; it is not taken from the robot's 35-second allowance.

Adapt the project's existing flying-mount movement system where suitable. Support responsive steering, altitude handling, banking, smooth acceleration and a stable tracking camera inside the permitted aerial volume. Keep its large wings and sword clear of terrain and solid obstacles. Track valid ground for eventual pet return.

Animate the same two rear thrusters, subtle wing-root adjustments and controlled hull banking. The pet remains continuously attached to the original counter-rotating cockpit. Preserve the finished ship's mechanical structure; flight and Dive do not require another transformation.

The menu must now contain:
- Dodge: Dive.
- One strong attack: Shockwave Pulsar.
- Ultimate: Dark Messiah, charged through the shared meter.
Disable the second strong slot and robot sword-attack bindings in this form. Do not add an unrequested second strong attack or new basic weapon. Movement alone does not deal continuous collision damage.

Changing form must not reset original or temporary ability cooldowns. Preserve any shared Dodge recovery when Glides becomes Dive. Keep each ability's existing cooldown record rather than overwriting saved loadouts with the new menu.
10. Dive — Airship Dodge replacement
Pressing Dive makes the airship spin in the air, swoop downward at enemies and then climb back into the air.

Begin with a clear aerial roll about the ship's longitudinal axis. The wings and long sword sweep through a curved violet trail, and the thrusters intensify as the craft pitches toward the selected enemy or aimed ground point.

Follow a fast descending arc into a low attack pass at the validated target location. The docked sword leads the dive; create a forceful dark impact or ground-skimming energy sweep at the lowest point. Use violet pressure streaks, dark mist and brief ground fractures to show the attack footprint.

Immediately pull up along a smooth climbing arc and return to a safe controllable flight altitude. The airship remains in its airship form. Do not leave it on the ground, revert to robot form or consume the finisher meter.

Keep the pet attached and stabilise the gameplay camera so the ship's roll does not invert the view. Use the actual hull and weapon clearance to avoid wing tips, the sword or the rider intersecting terrain.

Use one deliberate Dark damage event per enemy per Dive activation across the combined pass/impact area. Swept collision should reliably detect enemies, while multiple hull parts, sword trails and particles must not duplicate damage.

Validate the path, target surface and pull-up space before commitment. Reject an invalid dive or retain safe flight; never send the craft into a void or through a solid wall. Bound steering during the attack and permit another Dive only after its recovery and configured cooldown. Follow existing dodge protection conventions rather than adding permanent aerial invulnerability.
11. Shockwave Pulsar — The airship's only strong attack
The airship shoots a concentrated ray of light downward onto the ground. At the point of impact, the ground erupts into a powerful dark shockwave, dealing massive AoE Dark damage.

“Light” describes the visible brightness of the ray. The ability belongs to Susano O's Dark element; its damaging shockwave is Dark damage, not an element change to Light.

Use the existing docked sword channel and focus as the firing mechanism. Align the ship or its supported weapon pivot toward the valid target point, gather a compact white-violet charge, then release a short, sharply defined ray from the focus to the ground. Keep the beam connected and clear of the cockpit and hull.

At impact, compress darkness into a small brilliant point, then erupt it outward as a substantial black-violet shockwave. Show a bright expanding rim, dimensional shadow volume, temporary cracked-ground overlays and lifted debris fading into dark mist. The ground explosion is the damaging climax.

Resolve one substantial AoE Dark damage event per enemy per cast at impact. The charging glow, ray and decorative shockwave layers must not each apply duplicate damage. Keep the damage radius aligned with the displayed impact footprint. Do not permanently damage terrain or navigation.

Make this a responsive, repeatable strong attack with a brief casting/recoil animation and configurable cooldown. After firing, return to normal airship steering. It must not start the full Dark Messiah cinematic, transform the ship, remove the summon or eject the pet.

Keep its scale and timing distinct from Dark Messiah: Shockwave Pulsar is a concentrated ray and powerful ground shockwave; Dark Messiah remains the original much larger finishing beam and colossal explosion. Do not borrow Frozen's five-second beam or introduce an unrequested channel duration.

Use existing target selection and ground aiming. Reject invalid impacts and prevent the ray from travelling through blocking geometry under the game's existing beam rules. Valid Shockwave Pulsar damage charges the shared Dark Messiah meter.
12. Dark Messiah — Original airship finisher
Preserve Dark Messiah's original attack sequence: one massive dark-energy beam into the battlefield, a colossal dark explosion, then safe pet return and aircraft disappearance. Dark Messiah must now be the strongest attack in the entire game. Keep that requirement meaningful in actual damage tuning as well as presentation.

It is now activated from the already playable airship when the shared meter is full. On a fresh Ultimate input, validate the target and legal action state, consume the charge and commit to the finite finisher. Stop ordinary movement and lock Dive and Shockwave Pulsar while it plays. Wait for a valid Dive recovery pose rather than firing through an unfinished low-altitude pass.

Do not transform again: the ship is already assembled. Apart from separating the earlier Transform command from this attack's activation, retain the original beam, explosion, damage model and exit below.
Damage supremacy — required gameplay ranking
Make a complete Dark Messiah activation deal more damage than any other single attack activation in the game's comparable skill catalogue, including other ultimate finishers. This is a gameplay requirement, not just descriptive text.

For a reproducible comparison, use the same attacker stats, matched progression/rarity, a neutral high-HP target with identical defence, and no outside buffs or random critical advantage. Compare the total damage of one complete cast, including all intended hits, channel ticks and finite damage-over-time phases, rather than comparing Dark Messiah's explosion with only one tick of a competing attack.

Audit the implemented attack and finisher data, including multi-hit and sustained-beam ultimates. Tune Dark Messiah's final explosion coefficient so its per-target full-cast total has a clear lead over the next strongest comparable attack. A 1.25× lead over that benchmark may be used as a configurable initial tuning target; the fixed requirement is that Dark Messiah genuinely ranks first, and the exact margin remains a balance setting.

Perform the ranking check at corresponding supported progression tiers. Keep normal Dark-element resistance, mitigation and immunity rules; supremacy is established under comparable neutral conditions, not by bypassing combat rules. Use targets with enough HP that overkill does not conceal the damage comparison.

Keep this damage concentrated in the existing decisive final explosion. Do not achieve the ranking by adding unintended repeated hitboxes, extra invisible damage phases or a second explosion. Establish explicit coefficients in skill data and report the benchmark and chosen values. Recheck the rank when another attack's balance changes.

Give the charge, beam and final shadow eruption the strongest visual emphasis in the game's attack lineup while preserving readable silhouettes, effects budgets and accessibility settings. Keep Shockwave Pulsar clearly below this finishing tier.
A. Beam charge and discharge
The completed aircraft holds its firing position above the chosen area. Energy travels from the reactor and engine conduits through the hull into the docked sword's existing violet channel. Wing engravings illuminate and dark particles draw inward.

Gather a compact violet-white charge around the blade channel and point. The original gold guard, mechanical hands and clamps remain visible, bracing the weapon. Keep emission controlled so dark metal still has texture and volume.

The beam forms at the sword's point or the terminus of its recessed channel. A rotating energy ring around the focus may be a magical effect; no new physical barrel needs to appear.

Fire one massive beam of dark energy downward into the battlefield. Pitch the craft and, if the existing cradle joint permits it, make a bounded weapon adjustment so the beam clears all hull geometry and the pilot.

Use a dark central column, bright violet boundary, twisting translucent filaments and turbulent smoke. Show a continuous connection from the sword focus to the ground impact.
B. Massive dark explosion
At the impact point, darkness compresses briefly into a dense sphere, then erupts into a colossal three-dimensional explosion: a black-violet central bloom, a brilliant purple shockfront, rising columns of shadow and expanding ground rings. Lift temporary debris into the shockwave and let it dissolve.

Preserve the existing damage design: one decisive final AoE Dark damage event per affected enemy by default. The beam delivers the energy to that detonation. Its internal movement and particle overlap must not create frame-by-frame damage. Any additional phase must be explicitly authored in skill data rather than added by this transformation update.

Match the large, bounded damage footprint to the visible shockfront. Keep important silhouettes and telegraphs readable and respect the game's flash and camera-shake settings.
C. Pet return and aircraft disappearance
After the explosion, reduce the thruster glow and release the actual pet from its original cockpit along a controlled safe landing arc. Place it on valid ground clear of hazards, then restore normal control.

Once the rider is safely clear, the spacecraft breaks into fading armour silhouettes, violet fragments and dark mist. This is the deliberate summon dismissal. Major components must remain conserved and connected until that exit effect begins.

The ship does not need to transform back into a robot before disappearing. Do not add a second explosion or an unintended damage phase during disassembly.
13. Timing, cancellation and restoration
Use the lifecycle: summoning → active robot → Transform transition → active airship → committed Dark Messiah → safe return → normal combat. Robot or airship expiry can instead lead directly to a harmless safe return.

The pet uses its existing HP and defensive systems throughout. Keep one session identity, two explicit phase timers (35-second robot and additional 20-second airship), one continuous Dark Messiah meter and one 240-second outer ultimate cooldown. Transform ends only the robot phase; it neither ends the summon session nor starts the outer cooldown.

Accept Transform only from a valid live robot phase. On commitment, stop that phase timer and run the finite folding animation; successful completion starts a fresh 20-second airship timer. Resolve a request at the expiry boundary deterministically so the accepted transformation and robot timeout cannot both execute. A forced cancellation during folding uses the safe return path and does not grant free finisher damage.

If time expires in either playable form without the finisher, safely dismount the pet and remove the current form harmlessly. An active Dive must resolve to a safe return position without awarding unearned late hits. Track a valid ground location while airborne; never leave the unmounted pet over empty space.

If Dark Messiah was validly activated before expiry, let its finite sequence complete, with ordinary attacks disabled. This protection belongs to the committed finisher, not to the entire playable airship phase.

Give attacks, transformation callbacks and delayed effects session ownership. Previously released robot effects may follow the existing lifetime policy after switching forms, but cannot replay, duplicate or charge an ended session. On defeat, encounter reset or forced cancellation, stop pending actions, rays, damage and temporary controls. A defeated pet must remain defeated.

Menu replacement happens once on a successful Transform completion. Discard stale robot commands and remove their input listeners; do not let a held strong-attack key trigger an unintended airship cast. A held Transform input must never chain automatically into Dark Messiah.

Restore original Dodge, both normal strong attacks, ultimate, basic attacks, camera, targeting, collision and movement through one guarded cleanup path. Remove the single 35% movement modifier once on final exit, preserving unrelated effects and the saved loadout's actual cooldown progression.

Start Susano O's 4-minute / 240-second cooldown once when the summon session ends and normal control returns, whether through Dark Messiah or a normal timeout. Do not start it on Transform, Dive or Shockwave Pulsar, and do not restart it from repeated cleanup callbacks. Use the game's existing defeat/reset cooldown policy for forced encounter termination.
14. Sound, performance and acceptance checks
Use deep servo movements, rotating wing mechanisms, clean armour locks and a restrained dark reactor hum. Glides needs a rising sword whoosh and sharp contact accents. True Dark Blade needs a heavy metallic impact followed by a travelling low-frequency roar. Dark Spikes needs splitting stone, rising rock and a separate dark-energy detonation. Transform has a distinct sequence of hinges and locking clunks, followed by the quieter sustained sound of playable flight. Dive adds a rising thruster rush and swooping impact; Shockwave Pulsar uses a brief high charge and sharp dark-pressure blast. Dark Messiah retains its original sustained charge, powerful beam release and decisive final explosion.

Build a practical hierarchy of articulated rigid components. Pool repeated effects, reuse materials and geometry, and limit temporary lights. Lower visual settings may reduce secondary particles and reflection detail while preserving the silhouette, cockpit visibility, transformation choreography and all gameplay hits.

Verify the complete ability in the actual game:
- Susano O appears as the eleventh Dark ultimate without damaging existing roster or save data.
- The central pet cockpit remains readable during movement, strong attacks and transformation.
- The movement modifier is exactly 1.35 and is removed correctly.
- Robot controls show Glides, True Dark Blade, Dark Spikes and Transform.
- Transform completes the mechanical change and hands movement control to a playable airship without auto-firing Dark Messiah.
- Airship controls show Dive, exactly one Shockwave Pulsar strong button and Dark Messiah; the second strong slot and its binding are unavailable.
- Robot control lasts up to exactly 35 seconds; successful Transform handover grants a fresh 20-second airship phase exactly once.
- Transform preserves charge and HP and does not start the outer cooldown or apply the 35% movement modifier again.
- Dive visibly spins, swoops at enemies and climbs back into controllable flight, with one intended hit per enemy.
- Shockwave Pulsar visibly connects its bright ray to the ground and produces a massive Dark shockwave as a repeatable strong attack.
- Valid robot and airship damage fills the same meter; Dark Messiah is available only from airship form at full charge.
- Fast sword sweeps hit reliably without duplicate overlap damage.
- Dark Spikes uses Crown of Rock's actual model and effect components, with Dark variants that do not alter the Earth skill.
- The robot and spacecraft match the two-form concept, using the same blade fans, two thrusters, cockpit, limbs and intact giant sword.
- The torso pitches, cockpit counter-rotates, helmet stows, wings deploy, legs fold and original thrusters relocate through connected collision-free paths.
- The one-piece rear half-skirt becomes the dorsal cowling, leaving the front of the robot's mechanical legs exposed.
- Sword docking and hand contacts remain correct, without duplicate weapons, missing limbs or a newly invented cannon.
- The completed spacecraft fires from the docked sword focus, clear of the rider and hull.
- Cancellation during intermediate poses releases ownership and restores or cancels control safely.
- Dark Messiah remains the original finishing beam, colossal explosion and safe exit, without repeating the earlier transformation.
- Releasing Transform and pressing Ultimate again is required; held inputs cannot skip the playable airship phase.
- Damage charging, manual finisher activation, explosion damage and outer cooldown timing work correctly.
- Timeout during Glides, Transform, Dive or a strong attack; finisher activation near expiry; pet defeat; and encounter reset all restore or cancel the appropriate state.
- The full sequence permits up to 55 seconds of controllable form time; an early Transform does not carry unused robot seconds into the airship timer.
- The outer Susano O cooldown is exactly 240 seconds and starts once on final exit.
- Dark Messiah's full-cast damage ranks first against comparable attacks at matched progression on a neutral high-HP test target; all tick and multi-hit totals are included.
- Every airborne exit places the actual pet on valid ground.
- The model, texture response and effects match Beast Machine and Sports Car at the same camera distance and graphics settings.
Run the project's relevant checks and inspect representative gameplay captures. Finish with a concise account of the implementation, validation performed, configurable balance defaults and any real remaining asset or rendering limitations.