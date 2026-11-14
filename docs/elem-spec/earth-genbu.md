# Genbu — 11th Earth ult (the user's spec, verbatim)

The user's text follows unchanged. Provisional numbers and the team's decisions are in `docs/EARTH-GENBU-BRIEF.md`.

```
Implement Genbu, an Earth transformation ultimate in my existing Cocopets game.

Genbu is a gigantic mechanical turtle with beige armour, dark-orange fittings, a heavily spiked shell and an enormous drill mounted on its back. The pet rides in a protected station behind the drill.

Its finisher, Calamity, physically transforms the turtle into a controllable drilling vehicle that moves above and below the ground.

Match the high-quality 3D modelling, texture detail, advanced shading, animation and effects of Beast Machine. Inspect the existing project and implement the complete ability using its established combat and transformation systems.

Turtle form

Give Genbu a broad domed shell, low body, thick mechanical neck, small armoured turtle head and four enormous weight-bearing legs.

Its silhouette should communicate immense weight. The feet are wide, with substantial metal claws, visible joints, hydraulic pistons and layered armour.

Use warm sandstone beige for the main shell and body plates. Use dark burnt orange for structural borders, drill flutes, fittings and selected armour sections. Add dark steel machinery, polished piston rods and restrained amber illumination.

Divide the shell into six substantial articulated sections. Preserve the overall tortoise dome while giving each section visible thickness, bevelled edges, mechanical seams and structural connections.

Mount large orange-brown spikes across the shell. Add carved geometric markings, fine scratches, chipped painted edges, dust and restrained stone-like surface variation.

The head has an armoured beak, amber eyes and a telescoping mechanical neck. It retracts into a recess beneath the front shell rim.

Each leg contains a compact track cassette that remains visible in turtle form. There are four track units in total.

Dorsal drill and rider station

Mount one enormous working drill above the shell on a structural carriage with rails, support arms, bearings and a visible motor.

The drill has thick dark-orange helical flutes, hard metal cutting teeth, worn edges and a substantial tapered point. Its rotation should feel heavy and mechanically driven.

Place the pet’s cockpit on the rear upper chassis, behind the drill. Include a secure seat, controls and protective rails while keeping the actual pet visible.

Drill form

The second form is a massive, low drilling vehicle with a forward-facing drill, compact armoured hull, retained shell spikes and four short track pods.

The original drill carriage slides forward and lowers onto the centreline. The original shell sections fold around the chassis. The head retracts beneath the drill mount.

The four legs fold inward while their track cassettes rotate into ground contact, forming two short track pods on each side. Folded claws and limb joints remain visible beside them.

The tail folds into the rear structure. The cockpit stays attached to the same rear chassis mounting and remains upright.

Preserve the size, markings and material of every major part. The machine becomes lower through actual folding and suspension movement.

Transformation sequence

Build and validate the mechanism before adding fine surface detail:

1. Genbu braces its feet and opens the required shell clearances.
2. The head and tail retract.
3. The legs fold inward while the four track units rotate down.
4. The chassis transfers its weight onto the tracks.
5. The drill carriage moves forward and lowers along connected rails.
6. The carriage locks into its forward sockets.
7. Shell panels close around the compact hull and the drill accelerates.

All parts remain connected through hinges, rails or articulated arms. Check the entire motion path, including the pet, spikes and drill.

Controls

Normal control	During Genbu
Movement	Walk and steer the turtle
Dodge	Shell Roll
Separate Jump control	Jump
Strong attack 1	Rock You
Strong attack 2	Drill Cannon
Ultimate	Calamity charge gauge, then finisher

Jump remains available alongside Shell Roll. Do not combine them into one command.

Shell Roll — Dodge replacement

Genbu retracts its head, all four limbs and tail into the shell. The drill moves into a protected position using its existing carriage, and the rider remains securely supported.

The shell spins rapidly around its vertical axis while travelling across the battlefield, knocking through enemies in a playful but heavy shell-spin attack.

Use a broad circular damage volume following the movement. Show scraping stone, sparks, displaced dirt, spinning amber accents and a low dust ring.

The machine must remain mechanically coherent while spinning. Finish by slowing, extending the limbs and returning to turtle movement.

Apply intentional damage and displacement according to the existing enemy-resistance rules. Overlapping shell spikes must not create duplicate hits.

Jump

Adapt the heavy mounted jump behaviour from Beast Machine.

Genbu compresses its legs, launches upward and lands with a powerful Earth stomp. Show weight through piston compression, shell movement and a substantial impact.

The landing produces broken stone, dust, an expanding ground shockwave and Earth damage within its visible area.

Allow the player to jump repeatedly according to the configured jump cadence, while preserving valid landing positions and arena boundaries.

Rock You — Strong attack 1

Genbu braces as amber Earth energy spreads into the ground.

Large rock crystals thrust upward through the targeted area, lifting slabs of earth and striking enemies. Use sharp, dimensional formations with beige stone surfaces, dark-orange mineral seams and glowing internal fractures.

After a readable pause, the crystals explode into substantial stone shards and expanding Earth shockwaves.

Treat eruption and explosion as two deliberate damage phases. Keep visual debris separate from gameplay damage registration.

Drill Cannon — Strong attack 2

The dorsal drill spins rapidly as its motor builds power. Its mounting locks, vents release dust and amber energy flows around the bearing.

Launch the actual conical drill bit from its motor assembly toward enemies. The motor and carriage remain on Genbu.

The projectile twists and turns along a controlled corkscrewing route, drilling through the earth, lifting stone and carving a temporary trail of destruction. Finish with a massive Earth AoE impact.

Use a bounded trajectory and deliberate damage cadence so contact with many decorative fragments does not multiply damage.

The physical drill then returns along a visible recovery route and docks with the original carriage. Keep one identifiable main drill throughout.

Prevent another cast while the drill is away. If Calamity is activated during its travel, safely recall and reconnect it before transformation.

Calamity gauge

Charge the finisher from actual enemy damage caused by Genbu’s mounted attacks.

Start empty, count effective damage once and activate manually at full charge. Calamity’s own damage cannot recharge the gauge.

Calamity — Transformation and controlled drilling

On activation, recover the main drill and perform the connected turtle-to-drill transformation.

Replace the ordinary form timer with a finite Calamity sequence. Give the player actual control of the drilling vehicle.

Retain horizontal steering. Use the former Shell Roll control for Dive/Descend and the separate Jump control for Rise/Ascend.

The player can travel over the ground, plunge underground, turn while submerged, rise through the surface and continue moving. This must be a playable phase with freedom of movement.

Above ground, the drill tears through enemies and upheaves the earth. Underground, show surface cracks, moving ridges, displaced stones and an indication of Genbu’s position. On emergence, throw up stone slabs and a powerful Earth shockwave.

Use bounded depth and height limits. Preserve real terrain and navigation; visual excavation must not break the map. Prevent tunnelling outside valid encounter space.

Disable Rock You and Drill Cannon during this phase because the main drill is now the vehicle’s forward weapon.

Calamity — Eight-drill climax

At the end of the roaming phase:

1. Bring Genbu to a valid surface position.
2. Mark exactly eight distinct eruption locations across the affected battlefield.
3. Summon eight enormous rotating Earth drills from underground.
4. Each drill tears through a visible ground fracture, lifting stone and releasing dust.
5. Their seams glow, rotation accelerates and energy gathers.
6. All eight burst in a coordinated, massive Earth detonation.

These eight drills are temporary Earth constructs made from stone, orange crystal and amber energy. Genbu’s original physical drill remains attached to its body.

Keep exactly eight at every level unless later instructed otherwise. Manage eruption and burst damage explicitly, with a deliberate overlap policy.

Ending

After the final burst, briefly reverse the mechanism into the recognisable turtle silhouette.

Amber power flickers, fractures spread through the armour, the feet buckle and Genbu’s heavy shell settles. The turtle crumbles into stone-coated fragments, grit and fading dust.

Dismount the pet safely before the collapse. The crumble is the ending presentation and does not add another damage event.

Restore normal controls and begin the outer ultimate cooldown once.

Balance and quality

Genbu-specific cooldowns, damage coefficients and Calamity roaming duration remain configurable. If no profile exists, inherited 20/25/35-second mounted durations and a 120-second cooldown after exit may be used as provisional starting values.

Use the pet’s existing HP and status systems. Handle timeout, defeat, interrupted attacks and encounter reset without leaving underground actors, detached drills or active damage behind.

Verify both connected forms, four persistent track pods, simultaneous Shell Roll and Jump access, physical drill return, controllable burrowing, exactly eight final drills and the turtle’s crumble ending.```
