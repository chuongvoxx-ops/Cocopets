Beast Machine — Thunder Ultimate No. 11

Claude implementation prompt

Implement Beast Machine as the 11th Lightning/Thunder ultimate in my existing Cocopets game. Use whichever element name and identifier the project already uses.

The pet rapidly builds a hulking bronze-and-gold mechanical beast in a messy cartoon construction sequence, jumps into an open rider’s seat, and controls it as a temporary combat form. The machine fires homing thunder missiles, pounds the ground with electrical strikes and leaps around the battlefield. Dealing damage fills a special meter for Judgement Day, a spectacular leap, ground impalement, lightning-sphere storm and final burst, followed by the machine popping out of existence and ejecting its rider.

Inspect the existing project and Sports Car transformation first. Reuse its proven temporary-control, duration, finisher-meter and restoration systems where appropriate. Preserve the engine, art direction, controls, save data and working features. Add Beast Machine to the Thunder ultimate roster without overwriting existing skills or assuming that its display position is its internal ID.

Build the complete mechanic, detailed 3D model, animation, effects, sound and UI.

Progression and temporary commands

|Progression                |Homing Missiles per activation|Heaven’s Wrath strikes per activation|
|---------------------------|-----------------------------:|------------------------------------:|
|Base, levels 1–3           |10                            |1                                    |
|Level 4 — Adept, levels 4–6|15                            |2                                    |
|Level 7 — Celestial        |20                            |3                                    |

Heaven’s Wrath cooldown: exactly 2 seconds per completed activation, starting after the final strike of that activation. Do not allow the next activation to overlap an unfinished strike sequence.

Use Sports Car’s 20/25/35-second form durations and 120-second cooldown after exit as configurable starting defaults, since Beast Machine uses the same transformation structure. These are inherited balance defaults; preserve any Beast Machine values already explicitly configured in the project.

|Normal control      |Beast Machine control                              |
|--------------------|---------------------------------------------------|
|Movement            |Ride and steer the machine                         |
|Dodge               |**Jump**                                           |
|Strong attack slot 1|**Homing Missiles**                                |
|Strong attack slot 2|**Heaven’s Wrath**                                 |
|Ultimate            |**Judgement Day meter**, then its activation button|

Start the form timer when the mounted machine becomes controllable. Show the remaining duration. Use bronze, electric blue and gold accents for the temporary controls, with clearly distinct missile, fist, jump and lightning-sphere icons.

Temporarily suppress the pet’s normal attacks. Preserve the original loadout and cooldown state for correct restoration.

1. Fast, chaotic cartoon construction

Make the opening a quick, readable construction gag, approximately 1.5–2 seconds as a tunable starting point.

The pet drops or reveals a heap of mechanical parts and dives into a dense puff of dusty smoke. Show a fast sequence of hammering silhouettes, flying bolts, spinning gears and exaggerated tool movements. Use springy motion and sharp metallic clanks.

Let recognisable components appear through gaps in the cloud: one oversized hand lands, the dragon-shaped head swings into place, the shoulder shields snap shut and the twin cannon banks unfold.

A small misplaced panel briefly rattles before locking into position. Finish with a strong assembly clunk, one electrical spark and a final smoke puff revealing the complete machine.

The pet then jumps onto the open rider’s seat and grips its controls. The eyes and crimson fittings illuminate as electricity travels through the exposed cables.

Animate the visible assembly rather than hiding a static model inside an opaque cloud for the entire sequence. Keep temporary debris decorative and clean it up promptly.

2. Detailed 3D model and silhouette

Create a hulking bronze-and-gold mechanical beast with a gorilla-like forward-hunched stance and a long dragon-shaped armoured head.

The main visual features are:

• A broad, heavy torso leaning forward.
• A long tapered armoured snout hanging low between the shoulders.
• Recessed glowing eyes beneath a pronounced brow.
• Enormous rounded, shield-like shoulders covered in layered plates.
• Massive articulated forearms and broad clawed mechanical hands.
• Short sturdy rear legs with wide, splayed clawed feet.
• Overlapping armour, crimson fittings, rivets and restrained spikes.
• Exposed dark-violet cables, pistons and metal joints beneath the torso.
• Twin cannon batteries rising over the back and framing an open rider’s seat.

Make it feel like an ancient magical war machine with powerful weight and deliberate mechanical movement. Keep the seated pet clearly visible between the cannon banks.

Use proper mesh volume: curved armour shells, bevelled plate edges, recessed seams, layered hexagonal details, cannon barrel thickness and visible joint construction. Avoid a collection of unrefined primitive shapes.

Build a practical hierarchy of rigid parts with rotating joints, sliding pistons, separately moving hands and recoiling cannon mounts. Use limited secondary motion for the cables and rider. This should support expressive animation without needing a complex organic creature rig.

3. Advanced shading and surface detail

Use weathered bronze for the broad armour surfaces, brighter gold on raised trim, dark steel at joints and deep crimson jewel-like fittings.

Differentiate materials through colour, roughness, reflectivity and texture. Add fine scratches, subtle dents, dark seams, worn edges and recessed grime without making the model visually muddy.

Use the existing renderer’s supported lighting and material features to achieve rich 3D shading. Preserve readable highlights across curved shoulders and the long snout. Use normal detail for fine texture, while important silhouette features remain actual geometry.

Animate occasional small electrical sparks between exposed cables, fittings and cannon mounts. Give arcs a bright white core and electric-blue or violet fringe. Keep idle sparks sparse so heavy attacks feel more intense.

Crimson fittings can pulse faintly with stored power. Avoid coating the entire machine in emission: its metal should remain visibly metal.

4. Riding and movement

Give the machine a forceful bounding gait. Forearms and rear legs push against the ground, the shoulders roll, and the torso settles with visible weight at each planted step.

Use responsive existing movement controls. The rider follows the machine’s motion with restrained body sway and remains attached to the seat.

Moving into enemies can deal configurable Thunder charge/contact damage as part of the inherited mounted-combat structure. Gate hits per enemy and require real movement; standing against a target must not deal damage or fill the meter every frame.

Respect walls, boundaries, collision sizes and boss-displacement resistance. Do not permanently destroy terrain.

Use the pet’s existing HP and defensive systems. The machine is a temporary combat form, not a second life or a separate health pool.

5. Homing Missiles — Strong attack slot 1

Fire exactly 10, 15 or 20 Thunder missiles per activation, according to level.

The twin cannon banks tilt upward. Barrel interiors brighten, mounts brace, and missiles launch rapidly from alternating sides with recoil, muzzle sparks and short exhaust plumes.

The missiles must visibly rise into the sky first, fan into separate arcs, then turn downward and home toward enemies. Do not fire them as a flat horizontal stream.

Build dimensional metal missiles with pointed noses, small fins, glowing Thunder cores and tapered blue-white exhaust. Their curved trails should make the ascent and descent easy to follow.

Distribute targets across enemies within range while allowing multiple missiles to converge on a lone boss. Reacquire a valid target if one dies; otherwise expire safely.

On impact, create a compact electrical explosion, branching sparks and a brief luminous ground ring. Each missile produces one damage event with a configurable small splash radius. Direct hit and splash must not double-hit the primary target.

Use existing collision rules and a bounded flight lifetime. Keep missile damage and ability cooldown configurable according to the transformation’s balance; the 2-second requirement belongs specifically to Heaven’s Wrath.

6. Heaven’s Wrath — Strong attack slot 2

The machine raises one enormous hand and hammers it into the ground, sending a violent electrical eruption through a wide oval area in front of it.

Show the oval footprint clearly. Spread lightning filaments across that same area as the impact occurs, with blue-white sparks, golden electrical flashes and brief spectral ground fractures.

At base, perform one strike. At Adept, perform two connected strikes. At Celestial, perform three. Alternate hands where useful, with distinct lift, impact and recoil phases.

Keep the strikes fast enough for repeated combat use while preserving weight. Let players make bounded aiming adjustments between strikes rather than snapping the model through implausible turns.

Each strike deals one substantial AoE Thunder hit per enemy inside its oval. An enemy can be hit again by later strikes from the same activation. Decorative branches and cracks do not create unlisted damage ticks.

After the final strike, begin the 2-second cooldown for the entire ability. Keep the UI cooldown display aligned with the actual activation lock.

7. Jump — Replaces Dodge

Pressing Jump makes the machine crouch, compress its joints and spring high into the air, travelling toward the input direction or valid landing point.

Make this feel like repeatedly hopping a massive mechanical rabbit around the battlefield: an exaggerated high arc, heavy landing and short recovery before the next permitted jump.

During ascent, fold the hands slightly inward and extend the rear legs. Keep the rider securely attached. Show a moving ground shadow and a clear landing indicator so height does not make positioning confusing.

On landing, the limbs absorb the impact and a large circular electrical shockwave expands outward. Throw up decorative fragments, sparks and a ring of branching lightning, dealing one powerful AoE Thunder damage event.

Damage occurs on landing, not every airborne frame. Do not duplicate landing damage with ordinary charge/contact damage.

Use the existing dodge cooldown as an adjustable starting point, allowing frequent deliberate hops. Accept the next jump only after a valid landing and recovery, preventing midair jump spam. Preserve existing dodge-protection conventions without adding immunity for the entire flight.

Validate the path and landing position. Never cross prohibited walls, leave the arena or land inside impassable geometry.

8. Judgement Day charge meter

While mounted, the ultimate icon displays a separate Judgement Day meter starting empty.

Fill it from real enemy damage dealt by the current Beast Machine: moving contact hits, Homing Missiles, Heaven’s Wrath and Jump landings.

Count each resolved damage event once. Use effective damage after mitigation, excluding overkill. Misses, invulnerable targets, scenery, allies and cosmetic sparks grant no charge.

Make the conversion configurable, with a visible rising charge ring and increasingly bright lightning within the icon. At full charge, pulse the icon and show JUDGEMENT DAY.

The player activates the finisher manually. Reaching full charge does not trigger it automatically. Permit only one finisher per transformation, and do not let its own damage recharge the meter.

9. Judgement Day — Leap, impalement and electrical storm

Launch and ground impalement

On activation, lock out ordinary mounted actions and commit the machine to a finite finishing sequence.

Its crimson fittings flare, cannon banks fold into a braced position and the torso gathers electricity. It launches high into the air, briefly silhouetted by a branching lightning halo.

On descent, extend one enormous clawed hand downward and drive it into the ground, as though pinning the battlefield beneath it. Compress the shoulder and torso into the impact while the other limbs stabilise the machine. Keep the pet visible and secure.

Deal one initial impact hit in the indicated landing area. From the planted hand, send electrical veins outward to clearly marked positions across a broad, bounded section of the battlefield.

Lightning spheres

Form multiple large three-dimensional lightning spheres at those positions. Arrange them around nearby enemies and across valid terrain, creating an intentional pattern rather than random full-screen clutter.

Each sphere has a brilliant white-gold inner core, a translucent electric-blue shell, rotating violet filaments and layered branching arcs. Give it internal movement and depth; avoid flat glowing circles.

Connect nearby spheres with spectacular electrical arcs. Pulse the sphere fields for massive Thunder damage over a brief configured storm phase. Track damage per enemy per pulse for the whole storm, so overlapping spheres and decorative connections cannot multiply damage accidentally.

Match damaging areas to visible telegraphs. Electrical connections are decorative unless explicitly included in a supported damage region.

Final burst, pop and rider ejection

Accelerate the sphere filaments and pull the outer lightning inward for a short anticipation beat. Then detonate the entire field in one massive final Thunder burst.

Treat the final burst as one damage event per affected enemy, even where several sphere visuals overlap. Expand luminous shockwaves, release branching lightning upward and scatter fading electric fragments.

Immediately after the burst, the machine gives an exaggerated mechanical shudder and pops out of existence in a compact cartoon cloud of smoke, loose bolts and electrical sparks.

Eject the pet upward from the rider’s seat and land it safely nearby. The machine vanishes completely; the pet and allies take no damage from its disappearance.

The final electrical burst is the damage climax. Do not turn the subsequent cartoon pop into an unintended additional damage event.

10. Exit, cooldown and state restoration

If the form timer expires without Judgement Day, safely dismount the pet and remove the machine with a smaller smoke-and-spark pop. Do not grant the finisher’s damage.

If Judgement Day was activated before expiry, let its finite animation complete. Disable further machine attacks while it plays.

After timeout or successful finishing, restore the pet’s original movement, normal attacks, Dodge, both strong attacks and Beast Machine ultimate button. Start the inherited 120-second cooldown at that exit point, once.

Preserve original skill identities, equipment and normal cooldown behaviour. Temporary controls must not overwrite saved loadouts or reset hidden skills to ready.

If timeout occurs mid-jump, use a safe nondamaging dismount/landing path rather than leaving the pet airborne or awarding a late landing hit. On pet defeat, cancel the form and queued actions without ejecting a living replacement.

Cancel unreleased missiles, pending strikes and future pulse events when their owning sequence is cancelled. Already released projectiles follow the existing combat lifetime rules, but cannot charge an expired form. Clean up all temporary state on encounter end or reset.

Sound, performance and verification

Give the construction a rapid comic rhythm of clanks, hammer taps, squeaks and a final satisfying assembly thud. During movement, use heavy joints, cable buzz and occasional electrical crackles.

Missiles need ascending launches and descending whistles; Heaven’s Wrath needs deep hand impacts and spreading electrical snaps; Jump needs a strong landing boom. Judgement Day builds from a rising electrical whine to one decisive thunderclap, then a short playful mechanical pop.

Use shadows, local light flashes, restrained bloom and depth-aware smoke. Preserve the machine’s detailed silhouette during effects. Pool missiles and particles, limit dynamic lights and reduce decoration on lower settings without changing hit counts or simultaneous gameplay.

Verify roster placement as the 11th Thunder ultimate without overwriting prior entries; exactly 10/15/20 missiles and 1/2/3 Heaven’s Wrath strikes; the 2-second Heaven’s Wrath cooldown; safe repeated jumps; correct meter charging; one Judgement Day activation per form; and complete control restoration.

Test single bosses, groups, target death, interruption, expiry while airborne, finisher activation near expiry, pet defeat and encounter reset. Check cooldown starts on exit, cleanup runs once and no duplicate damage or stale input handlers remain.

Finish the full implementation, run relevant project checks, and report what was completed and any remaining limitations.