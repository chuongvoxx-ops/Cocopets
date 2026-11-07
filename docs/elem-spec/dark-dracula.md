# Dark Strong: Dracula — the user's spec (verbatim, 2026-11-07)

Row: key `dracula` replaces Dark Strong `blackglass` (Blackglass Fracture — it was the move failing elem-moves' damage check), cost 28, cd 6 (a Strong; a multi-dive sequence needs a little longer than the 2.4–3 s Strongs — adjust if the sequence is shorter), glyph 'feather'.

# Dracula — Strong Dark Attack

## Claude implementation prompt

Implement **Dracula**, a strong Dark\-element attack for Cocopets\. The pet transforms into a fully animated vampire bat, climbs above the battlefield, and repeatedly dives onto enemies to bite and siphon their blood\. Three\-dimensional spheres of darkness erupt around the attacks while crimson blood energy streams back into the bat, restoring its health\.

Inspect the existing project and Fujin ultimate first\. Reuse Fujin’s established ascent, target selection, dive sequencing and recovery systems where appropriate, while creating Dracula’s own transformation, flight, feeding animation and effects\. Adapt everything to the current engine, renderer and Cocopets art direction\.

Register Dracula in the game’s **strong\-attack category**, using its existing unlock, equip, resource and cooldown rules\. Fujin is the reference for repeated dive movement; Dracula must not require an ultimate slot or ultimate charge\. Keep the transformation and feeding beats compact enough for regular combat while retaining the advanced shading, textures and 3D effects described below\.

## Core mechanics and level scaling

|Attack level|Dive attacks|Healing per successful dive       |Maximum healing per cast|
|------------|-----------:|---------------------------------:|-----------------------:|
|Levels 1–3  |2           |6% of the casting pet’s maximum HP|12%                     |
|Levels 4–6  |3           |6% of the casting pet’s maximum HP|18%                     |
|Level 7+    |4           |6% of the casting pet’s maximum HP|24%                     |

Treat the 6% healing as **one heal per successful dive**, awarded when its blood\-siphon animation resolves\. Each dive must damage at least one valid enemy to earn healing\. Hitting several enemies, creating several darkness spheres or emitting extra particles must never multiply that dive’s healing\. Clamp healing to maximum HP\.

Use the selected enemy for the first dive, then reacquire valid enemies within the attack’s targeting range between dives\. The bat can attack the same enemy repeatedly when fighting a boss or lone target\. If a target dies before impact, retarget smoothly; if no valid enemies remain, end the sequence and restore the pet safely\. Empty dives grant no healing\.

Use the existing strong\-attack balance conventions for damage, range and cooldown\. Keep these values configurable and preserve any existing Dracula values\. Do not silently add stun, enemy displacement, invulnerability or other combat effects\.

## Transformation and attack choreography

1. **Transformation:** A tight spiral of black\-violet mist and crimson motes coils around the pet\. Its silhouette compresses, then two large leathery wings unfold from the darkness\. Reveal one recognisable vampire bat with pointed ears, glowing ruby eyes, small luminous fangs and a detailed body\. Preserve the casting pet’s identity through a subtle colour accent or facial feature where practical\.
2. **Ascent and aim:** The bat beats its wings and rises above the chosen enemy\. Use articulated wing joints, flexible membranes, a slight body roll and visible acceleration\. Its moving shadow and a brief dark\-red ground ripple communicate the intended strike location\.
3. **Predatory dive:** The bat folds its wings close and dives steeply toward its target, trailing curved ribbons of violet\-black smoke and thin crimson streaks\. Bank naturally into the attack; keep the bat visible through its trail\. Immediately before contact, flare the wings to brake and angle its head toward the victim\.
4. **Bite and blood siphon:** At impact, the bat briefly clings or hovers against the target at an appropriate body height\. Its fangs flash, and several stylised crimson blood droplets and narrow liquid ribbons pull visibly from the struck enemy into its mouth and chest\. Include a short feeding beat before the next ascent\. The enemy remains in place unless the existing damage system moves it\. A crimson pulse travels through the bat as the siphon completes and the 6% heal appears\.
5. **Darkness eruption:** Each successful strike triggers a large sphere of darkness at the impact and smaller eruptions around nearby enemies inside that dive’s damage area\. The spheres swell rapidly, briefly compress, then rupture into shadow vapour, curved fragments and expanding violet\-crimson shockwaves\. Synchronise these bursts with the bite so the battlefield reacts to every attack\.
6. **Repeat and finish:** The bat launches back upward and repeats the full dive\-and\-feed sequence exactly 2, 3 or 4 times according to level\. Vary the approach direction to make the flight feel alive\. Give the final dive the strongest wing flare, deepest sound and largest visual eruption without adding an extra attack or heal\. After the final siphon, the bat dissolves into curling mist and the original pet reforms at a valid ground position\.

## Advanced shading, textures and 3D effects

**Bat materials:** Give the wings actual thickness and articulated geometry, with fine veins, subtle wrinkles and a textured membrane\. Use normal and roughness variation supported by the renderer: the membranes should catch restrained leathery highlights, while the body reads as soft, dark fur\. Add muted crimson light transmission through backlit wing edges where supported, with deep folds at the joints\. Keep the bat readable against the dark effects using a narrow violet or ruby rim light\.

**Flight animation:** Animate shoulders, elbows, wing fingers and membrane tension together\. Wings stretch on the downstroke, flex on recovery, fold during the dive and spread forcefully while braking\. Add restrained secondary motion to ears, feet and tail\. Maintain convincing body pitch and banking throughout the trajectory\.

**Darkness spheres:** Build them as genuinely shaded 3D volumes or meshes using the renderer’s supported techniques\. Give each sphere a midnight\-black core, layered swirling violet smoke, subtle surface distortion and a thin crimson\-violet rim that changes with the viewing angle\. Use depth, light response and moving internal layers to create volume\. Reserve emission for cracks, edges and small highlights so the centre retains darkness and texture\.

At detonation, rupture each sphere from within: bright fissures open, the shell breaks into curved fading pieces, and smoke rolls outward with clear depth and soft intersections against the ground\. Add a brief local distortion ripple if supported\. Use a lightweight layered\-mesh or particle approximation when volumetric rendering is unavailable\.

**Blood effects:** Make the siphon clearly directional, from enemy to bat\. Use glossy deep\-red droplets with small specular highlights and curved ribbons that narrow as they enter the mouth\. Keep it stylised and consistent with Cocopets\. Finish the transfer with a contained crimson glow across the bat’s chest and wing veins\.

**Lighting and readability:** Add restrained impact lighting on nearby enemies and ground, moving contact shadows and controlled bloom\. Keep enemy silhouettes, health bars and attack telegraphs readable\. The bat and its feeding motion must remain the visual focus\. Any distant decorative eruptions must stay visually distinct from damaging areas and must not create additional hits\.

## Sound, timing and implementation checks

Layer leathery wingbeats, a rising air rush, a low bite impact, a brief liquid siphon and a deep shadow burst\. Give the final strike a stronger bass accent and a short, restrained camera impulse\. Respect existing reduced\-motion and camera\-shake settings\.

Resolve damage at the actual strike and healing at the completed siphon\. Tie gameplay to explicit attack events, not particle counts or frame rate\. Use one damage application per enemy per dive for the overlapping bite\-and\-sphere effect\. Restore the pet’s model, controls, collision and targeting state on completion, interruption or death, and clean up all temporary effects\.

Verify the 2/3/4 dive thresholds, one heal per successful dive, repeated attacks against a lone boss, target death during descent, early termination when combat ends, and correct restoration of the original pet\. Pool particles and effects, limit temporary lights and scale decorative detail to the device while preserving the full animation and combat behaviour\.

The finished attack should clearly show **transformation → ascent → dive → bite → blood drawn into the bat → healing → renewed ascent**, with rich, dimensional darkness eruptions accompanying every strike\.