# Changelog

## 2026-05-18

### Foundation Quality System
- Added `FoundationQuality` type: fractured, unstable, stable, refined, perfect
- `breakthroughEngine.ts` determines quality from foundationStability, impurity, trainingFatigue, cultivationInsight, and technique mastery scores
- Stat gains on breakthrough are quality-scaled: fractured gives flat +2, perfect gives +10 base with top two stats boosted to +13
- maxQi and maxHealth increases are also quality-scaled (fractured: +5/+2, perfect: +22/+15)
- Fractured and unstable breakthroughs carry impurity penalties; refined gives a small stability bonus
- `getFoundationOutlook(player)` produces preview text listing helpful signs and risks before attempting
- `foundationQuality?` added to Player; character panel shows the label after first breakthrough
- `ChoiceEffect.breakthrough` now passes `foundationQuality?` override and `foundationCost?` through the engine

### Delayed Choice System
- Added `ChoiceDelay` type: `{ seconds?, stages, resultTitle?, resultBody? }` and `delay?` on Choice
- Choices with a delay show a timed progress panel instead of immediately resolving
- Stage text cycles through `stages[]` as the bar fills; breakthrough delays show a background image and a dedicated styled panel
- After the timer finishes, `resolveChoice` runs normally
- Discovery result screen appears after search-type delays when rewards are gained, with title, body, and item lines
- Breakthrough result screen appears after breakthrough delays with quality title, flavour text, and stat gain summary
- `resolveChoice` now gates which overlay to show: breakthrough result takes priority over discovery result

### Crafting Engine Expansion
- `craftingEngine.ts` rebuilt with facility, tier, and location gating
- Three facility types: `field_kit`, `alchemy_room`, `blacksmithing_room`; each has three tier levels
- Field kit tier driven by Mortal Repair Bundle inventory plus room upgrade and skill flags
- Alchemy room tier driven by Medicine Hall reputation, room workbench upgrade, and lesson flags
- Blacksmithing room tier driven by Craft Hall reputation, Luo Jiwei trust flags, and lesson flags
- `hasCraftingFacilityLocation` checks current sceneId so alchemy and forge recipes only work in the right place
- `getCraftingFacilityUnlockHint` and `getCraftingFacilityLocationHint` surface actionable hints in the crafting UI
- Crafting bottleneck system: when a required skill has hit its practice cap but not yet advanced, `getCraftingBottleneckAttempt` returns a chance-based breakthrough attempt
- `attemptCraftingBottleneck` rolls the chance; failure increments `skillBottleneckFailures` and raises next-attempt odds; success advances the skill rank and crafts the item

### Skill Bottleneck Tracking
- `skillBottleneckFailures: Record<string, number>` added to Player and seeded empty in `gameState.ts`
- Base breakthrough chance is 20%; each failure adds 15%, capped at 90%
- `isSkillAtBottleneck`, `getSkillBottleneckSuccessChance`, and cumulative exp display helpers added to `skillEngine.ts`

### Day and Time Tracking
- `TimeOfDay` type: Morning, Afternoon, Evening, Night
- `day: number` and `timeOfDay: TimeOfDay` added to Player; initial state is Day 1 Morning
- `advanceTime?: number` added to ChoiceEffect for sub-day actions (1 block = one time period)
- `consequenceEngine` converts advanceTime blocks using `advancePlayerTime` from `timeEngine`

### Area Images
- `lower_grove`, `scripture_pavilion`, `medicine_garden`, `medicine_hall`, `craft_hall`, `arena`, `cloud_edge`, and `black_thread_hollow` all given images in `sceneAreas.json`
- `image?: SceneImage` added to Enemy type for future enemy portrait display

## 2026-05-15

### Time And Progression Tests
- Added a simple calendar system with day plus Morning, Afternoon, Evening, and Night time blocks.
- Character stats panel now shows the current in-game day and time block.
- Choice effects can now advance time by blocks, while existing day-long actions advance the calendar by full days.
- Cultivation now consumes a time block, making repeated qi gathering less free.
- Added the Craft Hall Basic Test as a full-day bottleneck requiring Iron Sense and Tool Repair before unlocking sharper Craft Hall progression.
- Craft Hall forge practice, paid lessons, coal sorting, and room work now consume time blocks.
- Added Medicine Hall alchemy room progression with paid/free supervised bench access, Lan Ruxue lessons, burner-cleaning work, and a full-day basic alchemy test.
- Alchemy recipes can now use either the personal Alchemy Workbench or Medicine Hall alchemy access as their facility requirement.

### Crafting Progression And Facilities
- Added optional village kit progression: family, Aunt Lin, Blacksmith Guo, and Old Ren each provide one missable piece toward the Mortal Repair Bundle.
- Mortal Repair Bundle now forms automatically once all four village pieces are collected.
- Added field crafting requirements so travel recipes can require the Mortal Repair Bundle without consuming it.
- Added facility-gated crafting requirements for field kit, alchemy room, and blacksmithing room access.
- Added early field recipes and items such as Simple Field Bandages and Field Staff Binding.
- Updated crafting UI lock summaries to show missing tools and missing facilities, not just ingredients and skill ranks.

### Room Upgrades
- Rebalanced early room upgrades so meditation mat, writing desk, and herb shelf are cheaper and more immediately useful.
- Added Tool Rack upgrade tied to the Mortal Repair Bundle, with room actions that improve campcraft and tool repair.
- Added Alchemy Workbench upgrade tied to Medicine Garden trust, with room actions that improve herb and refining skills.
- Alchemy recipes now require the Alchemy Workbench facility, separating recipe knowledge from having a proper place to prepare medicine.

### Craft Hall And Sect Forge
- Added Craft Hall as a sect area accessible from the outer sect paths.
- Added Han Qingshi, a Craft Hall outer instructor who teaches paid blacksmithing lessons and gates stronger instruction behind reputation.
- Added paid Craft Hall forge access for 1 spirit stone, with high Craft Hall reputation allowing free forge bench access later.
- Added Craft Hall coal-sorting work assignment as a free reputation and skill path.
- Blacksmithing-room crafting can now be unlocked through either Luo Jiwei's town forge path or Craft Hall forge access.
- Moved Bone-Reinforced Staff out of starting recipes so it is learned through blacksmithing instruction instead.

## 2026-05-14 (Session 2)

### Post-Combat Choice System
- Added full post-combat choice panel after every enemy defeat: Spare, Kill, Interrogate, Blood Oath, Harvest Qi, Claim Technique, Strip Cultivation, Defile, Absorb Death Qi, Leave
- Choices gated by enemy type (beast/spirit/mortal/cultivator), corruption, willpower, spiritualSense, and dark constitutions
- Interrogate and speech options locked for beasts and spirits — they cannot speak
- Harvest Qi and Defile Spirit Core restricted to cultivators only (beasts have no meridian pathways)
- Combat engine now defers spirit stone and item rewards to post-combat resolution — qi reward still applies immediately
- Victory screen replaced with two-stage panel: choosing stage shows choice buttons with alignment colour coding (light/neutral/dark), result stage shows outcome messages and what was gained
- All 12 enemies tagged with postCombatType, speechDifficulty, and secretStash where applicable
- Cultivators (corrupt_outer_disciple, black_thread_cultist) given teachableTechnique fields

### UI Upgrades
- Glowing 3D liquid bars for HP, Qi, cultivation progress, and enemy health
- Parchment-styled combat log with per-entry type classes and damage number highlighting
- Hexagonal clip-path wooden plaque headers with rivet pseudo-elements
- Sect theme switching: Azure Clouds applies teal palette to CSS variables
- Character portrait image wired for male characters (Male_character.png)
- Iron Bridge Town panorama image added and linked to scene area
- Post-combat choice panel CSS with alignment tints (green/gold/red left border)

### Quest Board
- QuestBoardScene exported NOTICE_BOARD_IMAGE constant — any scene with type questBoard uses the board image automatically
- Alt text on board image now uses scene.title instead of hardcoded string
- Leave-row buttons now filtered by canChoose so hidden/met choices disappear cleanly
- Board paper stamp shows "Cleared" when quest is completed, "Claimed" when active

### hidden Flag on Choice
- Added hidden?: boolean to Choice type
- When hidden: true and requirements not met, choice is completely invisible rather than greyed out
- Applied to all quest-gated choices in Iron Bridge Town (notice board bounty, blacksmith dialogue, turn-in buttons)
- QuestBoardScene board papers also respect hidden flag

### Spirit Boar Quest Fixes
- Notice board converted to type questBoard with quest_board.png as board background
- Removed duplicate overlapping board papers
- Beast_hide no longer given twice (removed from town_east_clear, comes from post-combat kill only)
- Bounty reward (3 spirit stones) moved from town_east_clear to explicit turn-in at notice board or blacksmith
- "Ask about the bounty" option at blacksmith hidden after quest is completed
- Post-combat interrogation options no longer appear when fighting the spirit boar (beast type)

## 2026-05-14

- Fixed enemy JSON typing so combat and post-combat systems build cleanly.
- Changed save slots to be profile-scoped by username, with old unscoped saves still loadable as a fallback.
- Made save owner handling defensive so older local sessions without a username fall back to the guest save profile.
- Made character creation automatically save the new character into slot 1 for the active profile.
- Login, register, and guest entry now load the matching profile's latest save list and saved game state.
- Converted Azure Cloud Mountain Gate scene art from JPEG to PNG and updated the scene area reference after the in-app browser blocked the JPEG request.
- Added Phase 5 crafting expansion data: 13 new recipes, 11 new crafted items, skill gates, buffs/drawbacks, and two supporting skill definitions.
- Made equipment max health and max qi effects apply when gear is equipped or unequipped.
- Added known recipe tracking so crafting recipes must be learned before appearing in the crafting panel.
- Added NPC reputation recipe unlock paths for Luo Jiwei, the Medicine Garden Senior Sister, and Elder Shen.
- Added supporting trust quests for Luo's salvage work, medicine recipe instruction, and bottleneck foundation instruction.
- Added the Combat Prose Codex as a repo writing reference, with companion rules for technique-specific fight narration.
- Updated the roadmap with Hermit/Explorer technique parity, Phase 6 technique synergy ideas, Sunder-Heart Palm, the Wall-Faced Remnant, and Phase 7 faction-score/quest-board expansion plans.
- Added Foundation Establishment resource-path planning: Void Hollow Root for risky explorer breakthroughs and Foundation-Stabilizing Decoction for safer hermit breakthroughs.
- Clarified faction quest board evolution should never hard or soft lock the player; hostile boards must expose a recovery route.
- Improved the crafting panel with output item previews, equipment/use effect summaries, and per-ingredient owned/missing counts.
- Added delayed search resolution to the roadmap: optional 3-second animated investigation bars for search/tracking/exploration choices.
- Added crafting filters for All, Craftable, Locked Ingredients, and known recipe categories, plus crafting empty-state hints.
- Added source / teacher labels to crafting recipes and displayed them in the crafting panel, wrapping Phase 5 crafting polish.
- Reworked the Arts tab into readable technique cards with filters, descriptions, mastery bars, and benefit summaries.
