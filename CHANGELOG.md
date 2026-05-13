# Changelog

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
