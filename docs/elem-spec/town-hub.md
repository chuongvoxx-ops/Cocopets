Here’s a prompt you can paste into Claude. There’s also an expanded version with implementation checks⁠￼.

I want a major overhaul of the current pet base/house in Cocopets. Transform it into a beautiful, fully explorable 3D town that serves as the game’s permanent main hub.

Use the existing mini-game town as the reference for free movement and exploration. Players should naturally walk between their house, farm, training grounds, shops and other activities. This town should become somewhere players enjoy spending time with their pets between adventures.

Implement this within the existing game. First inspect the current base, mini-game town, movement, camera, pet systems, progression, inventory and saving. Reuse working systems and preserve existing progress.

1. The overall experience

The town should feel peaceful, magical and alive, with enough detail and interaction to make exploring enjoyable.

Players should be able to:

* Walk around with their Cocopet.
* Feed, pet, play with and relax beside their pets.
* Grow ingredients and prepare food.
* Train pets, level up and improve eligible skills.
* Upgrade their home and facilities.
* Decorate their surroundings.
* Discover scenic corners and small interactions.
* Walk to entrances for existing adventures and mini-games.

Create one continuous outdoor map with connected paths, streets, gardens, bridges and gentle changes in elevation. Players should walk between neighbouring facilities without loading screens.

Preserve the existing controls and camera. Facilities should become usable when approached, with clear interaction prompts and focused menus where needed.

2. Town layout

Design a compact settlement around a memorable central landmark. Create looping routes and shortcuts so movement feels natural and everyday activities remain convenient.

Include these destinations:

Destination	Design and purpose
Central plaza	A flowering tree, sculpted fountain, patterned paving, benches and hanging lanterns. This is the arrival point and main orientation landmark. Pets occasionally gather here.
Pet house and courtyard	A charming cottage overlooking town, with a tiled roof, timber framing, chimney, flower boxes and welcoming porch. Include a usable interior for feeding, sleeping, bonding, storage and decoration.
Farm and orchard	Terraced vegetable plots, fruit trees, irrigation channels, trellises and a tool shed. Players physically approach plots to plant, water and harvest. Leave room for a greenhouse upgrade.
Training grounds	A detailed dojo beside an outdoor practice courtyard with training targets, equipment and banners. Players train pets and test equipped attacks safely.
Elemental sanctuary	An elevated garden with carved shrines, crystals and reflective pools. Connect this location to the game’s existing skill, elemental or evolution systems.
Market and kitchen	Colourful stalls with awnings, produce baskets, hanging signs and steaming cookware. Players buy supplies, sell eligible goods and cook pet food.
Workshop	A distinctive craft building with a stone hearth, tools, timber beams and an outdoor workbench. Use it for supported crafting, decorations and facility upgrades.
Riverside garden	A winding stream, arched bridge, reeds, wooden dock and picnic area. Provide relaxing pet interactions and small discoveries.
Adventure and mini-game entrances	Recognisable entrances connected to the town’s main paths. Integrate the existing adventure systems and mini-game town while preserving their progression.

Connect frequently used activities with short routes. As a starting target, walking between paired activities should take approximately 10–20 seconds at normal movement speed, adjusted through playtesting.

Include a few optional paths leading to a lookout, hidden flower garden, shaded reading bench or pet-sized hideaway.

3. Detailed 3D buildings and props

Keep Cocopets’ stylised, cel-shaded identity while substantially improving environmental richness.

Aim for a handcrafted fantasy village with warm timber, cream plaster, mossy stone, colourful tiled roofs, lush greenery and restrained magical accents.

Buildings must have convincing three-dimensional construction:

* Roof thickness, overlapping tiles, ridges and overhanging eaves.
* Timber posts, crossbeams, carved supports and stone foundations.
* Recessed doors and windows with frames and shutters.
* Porches, balconies, chimneys, awnings and hanging signs.
* Flower boxes, climbing plants, stacked firewood and outdoor furniture.

Give each important building a distinct silhouette that players can recognise from the normal gameplay camera.

The pet house should contain beds, rugs, feeding bowls, shelves, toys, a fireplace and comfortable resting spots. Use roof cutaways or the existing interior system to maintain visibility.

Create detailed 3D props: baskets containing produce, clay pots, crates, watering cans, tools, sacks, stools, lanterns, books, dishes and pet toys.

Arrange props in purposeful clusters around activities. Keep paths clear and maintain enough open space for comfortable movement.

Layer the landscape with trees, shrubs, flowers, grass, rocks and shaped riverbanks. Add accessible ramps, small terraces and bridges to give the town depth.

4. Atmosphere and environmental animation

Use soft sunlight, readable shadows and warm lighting. Ensure the player and pets remain easy to see.

Add subtle environmental movement:

* Foliage swaying.
* Petals drifting.
* Fountain splashes and water ripples.
* Chimney smoke.
* Fluttering banners.
* Occasional butterflies.
* Gentle cooking and workshop effects.

Include local sounds such as flowing water, birds, wind chimes and footsteps changing with the surface.

If an existing time system supports it, add evening lanterns and glowing windows. Otherwise, prioritise a polished daytime environment before introducing a full day/night system.

Fade foreground objects and roofs when they obstruct the player.

5. Make the pets feel at home

The active companion should follow naturally, navigate around obstacles and settle nearby when the player stops.

Give pets expressive behaviours:

* Approach the player for affection.
* React visibly when petted or fed.
* Investigate flowers and toys.
* Watch the stream.
* Sit beside the player on a bench.
* Curl up on beds or rest in sunny patches.
* Briefly investigate nearby objects before returning.

Preserve the current player-control model and existing follow/wait commands.

Where supported, allow selected inactive pets to roam designated home areas. Limit the number of visible pets appropriately for performance.

Add small elemental interactions consistent with their designs: Water pets creating gentle ripples, Wind pets stirring petals or Fire pets warming the hearth.

Every care interaction should produce a visible response. Connect rewards to existing bonding and progression systems.

6. Farming, cooking and progression

Implement a complete farming loop:

Obtain seeds → plant → tend → grow → harvest → cook → feed pets.

Show distinct crop stages, watered soil and satisfying harvesting feedback. Begin with a manageable selection of crops and recipes.

Food benefits should fit the existing combat and pet-care economy. Explain benefits clearly before consumption.

Save crop progress reliably. Mature crops should remain available for harvesting so players can return at their own pace.

Give training and skill development physical locations in town. Preserve existing level caps, rarity requirements, ultimate restrictions and resource costs.

Keep pet levels, individual skill progression, bonding and facility upgrades understandable and distinct.

Town upgrades should visibly change the environment: a larger dojo, improved crop beds, a restored shrine, an expanded porch or a better workshop.

7. Decoration and exploration

Let players personalise the home and courtyard with beds, plants, lamps, rugs, fences, furniture and earned trophies.

Use placement rules that prevent decorations from blocking paths, doors, spawn points or interactions. Save decoration choices.

Reward occasional exploration with a small collectible, recipe, decoration or charming pet interaction.

Provide a readable optional map and unobtrusive destination markers. Buildings should remain recognisable through their design.

8. Implementation and quality requirements

Build this using the project’s existing architecture. Map every current base function to its new physical location and preserve save compatibility.

Use appropriate collision, pathfinding, shared materials, reusable meshes, detail levels and culling. Keep expensive lighting and ambient effects within the game’s performance budget.

Prioritise these stages:

1. Connected terrain, paths, collision, camera handling and reliable pet navigation.
2. A functioning house–farm–kitchen–training loop with persistent progress.
3. Remaining facilities and integration with existing adventures and mini-games.
4. Detailed buildings, props, interiors, landscaping and pet behaviours.
5. Decoration, visible upgrades, ambience and performance polish.

Verify that players can leave the house, harvest ingredients, cook food, feed their pet, train, enter an adventure and return with their progress intact.

Check every intended route for stuck pets, obstructed cameras and unreachable interactions. Verify that purchases, rewards, crops and decorations save correctly.

Deliver a functioning, visually cohesive town where caring for Cocopets, developing them and simply spending time together are rewarding activities. Give the environment enough craftsmanship, personality and interaction that players genuinely want to return home.