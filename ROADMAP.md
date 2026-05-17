# Xianxia RPG — Development Roadmap

## Current State (as of May 2026)

### Engine Systems — Complete
- Scene engine with conditions, consequences, flags, outcomes
- Combat system (turn-based, enemy data-driven)
  - Power tier narration scaling (dominant / contested / struggling)
  - Technique-active combat moves with mastery-tier narration (novice / practiced / mastered)
  - Enemy phase system (threshold-triggered behavior + narration shift)
  - Post-combat reflection (prose calibrated to power gap, health lost, turns taken)
- Quest system (start / update / complete / fail)
- Crafting system (ingredient requirements, skill gates)
- Skill system (EXP practice, capped bottlenecks, and higher-tier breakthrough attempts)
- Technique system (learn + mastery tracking)
- Breakthrough system (realm/stage advancement with stat costs)
- Elemental essence and constitution awakening
- NPC journal (meet + conversation log)
- Social scores (relationships, reputation, morality, sect contribution)
- Interactive quest board (2D image with hover tooltips and click-to-accept)
- Room base system (upgradeable activities: cultivation, study, herb shelf, journal)
- Condition engine supports: stats, flags, flagsAbsent, items, techniques, techniqueMastery, skills, elements, realm/stage, relationships, reputation, morality, sect contribution

### Content — Complete
| Area | Status |
|------|--------|
| Mortal village arc | Complete — village NPCs, mortal training, trade road, exam prep |
| Azure Cloud mountain approach | Complete — mountain gate, stone tablet trial, mist wolf |
| Sect registration | Complete — exam, first breakthrough (Mortal Middle), arrival |
| Outer sect daily life | Complete — courtyard, paths, dormitory, room base, quest board |
| Lower grove | Complete — patrol, herb gathering, cold face (ice-vein herb) |
| Mortal Middle → Late breakthrough | Complete — elder guidance, ice-vein herb, mist-core qi draught, room attempt |

### Content — Thin (needs expansion)
- **2 enemies** — mist_wolf, road_bandits (both have phases; need 8–10 more)
- **2 techniques** — azure_cloud_breathing, pine_shadow_step (combat system ready for more)
- **18 crafting recipes** — Phase 5 expansion added; recipe access now unlocks through NPC trust and facility tiers
- **9 quests** — mostly short outer sect tasks
- **18 items** — limited variety

---

## Roadmap

### Phase 1 — Enemy Roster Expansion ✓ COMPLETE
*The combat system is built and polished. Now it needs opponents.*

- [x] 8–10 new enemies across tiers:
  - **Grove / wilderness**: spirit boar, shadow viper, cloud stag, stone crab
  - **Human**: bandit scout, bandit lieutenant, corrupt outer disciple
  - **Spirit / dungeon**: mist shade, bone hound, black-thread cultist
- [x] Each enemy gets: phase data, power-appropriate stats, loot table, description
- [x] Enemy variety feeds directly into Phase 3 (dungeon needs 2–3 per area)

### Phase 2 — Technique Expansion ✓ COMPLETE
*The technique combat system is built. New techniques plug straight in.*

- [x] Iron Body hardening method — defensive cultivation, reduces incoming damage, teaches endurance
- [x] Wind Blade strike — fast elemental strike, Wind affinity scaling, low qi cost
- [x] Void Step — advanced movement technique (unlocks after pine_shadow_step mastery 3)
- [x] Elemental technique unlockable through dungeon discovery (reward, not taught)
- [x] Technique mastery passive bonuses at rank 5 (azure_cloud_breathing rank 5 → +1 qi per cultivation session; iron_body_method rank 5 → permanent -2 flat enemy damage)

### Phase 3 — First Dungeon ✓ COMPLETE
*The black-thread token thread; first taste of the open world*

- [x] Dungeon: The Black-Thread Hollow (22 scenes)
  - Entry via the broken trade route thread (black-thread token + cultivationInsight gate)
  - Three branching paths: combat (bone hound), stealth (pine_shadow_step / void_step bonus), lore (tattered_sect_notes or spiritualSense)
  - Boss encounter: black-thread cultist leader with two phase announcements
  - Discovery rewards: thunder_current_strike technique, void_hollow_root ingredient, black_thread_codex lore
  - Resolves the "something above the bandits" thread from the trade road
- [x] Dungeon template established for future areas

### Phase 4 — Nearby Town ✓ COMPLETE
*Opens free exploration; gives the explorer path a destination*

- [x] Town: Iron Bridge Town (one day's travel from the sect, 20 scenes)
  - Marketplace: elixir counter + materials vendor (standard_qi_pill, road_healing_draught, frost-vein herb, salves)
  - Blacksmith: Luo Jiwei NPC — spirit-grade shortsword, crude leather vest
  - Inn: Shu Yilan NPC — paid rest (health restore), crossroads rumours scene
  - Notice board: spirit boar bounty (town_boar_bounty quest, 3 spirit stones)
- [x] Travel system (sect ↔ town via mountain road, one departure scene, one return scene)
- [x] Road encounter: bandit_lieutenant ambush at the mountain pass (combat / stealth / intimidate options)

### Phase 5 — Crafting Expansion
*Makes gathering and exploration feel rewarding*

- [x] 13 new recipes across categories:
  - Elixirs (qi pills, impurity-cleansing tonics)
  - Weapons (spirit-grade sword, reinforced rod)
  - Medicine (wound salves, fatigue tonics)
- [x] Skill-gated recipes using Alchemy, Survival, Blacksmithing, Martial Arts, and Cultivation Foundation skills
- [x] Rare ingredient locations tied to dungeon, town, lower grove, and beast-hunt content
- [x] Crafting skill tree expansion with Craftsman's Hand and Breath Discipline
- [x] Recipe unlock scenes tied to NPCs and crafting locations
  - Luo Jiwei trust path unlocks practical weapon and armor patterns.
  - Medicine Garden Senior Sister trust path unlocks pills, poultices, antivenom, and residue-control tonics.
  - Elder Shen bottleneck guidance unlocks the foundation-stabilizing decoction.
- [x] Crafting UI polish
  - Result previews show crafted item effects.
  - Ingredient rows show owned / required counts.
  - Filters separate All, Craftable, Locked Ingredients, and recipe categories.
  - Recipe cards show source / teacher labels.

### Phase 6 — Mortal Peak Arc
*Central dramatic arc of the mortal stage*

- [ ] Crafting facilities and recipe tiers
  - [x] First-pass facility tiers implemented for Field Kit, Alchemy Room, and Forge.
  - [x] Recipe cards show required facility tier, current access, required tools, and unlock hints.
  - [x] Higher-tier access is linked to existing world progression:
    - **Field Kit II**: room tool rack, Craft Hall field reinforcement, or Campcraft rank 3.
    - **Alchemy Room I**: Medicine Hall reputation 4, supervised bench access, or basic Medicine Hall preparation.
    - **Alchemy Room II**: Medicine Hall reputation 8, alchemy workbench, Medicine Hall test/residue training, or Elder Shen guidance.
    - **Forge I**: Luo Jiwei help/basic patterns, Craft Hall reputation 4, forge access, or forge safety instruction.
    - **Forge II**: Craft Hall reputation 8, free forge access, advanced Luo patterns, Han's test, or spirit-material handling.
  - Split crafting access by facility so place matters, not just menu access.
  - **Travel / field crafting**: available on the road, in dungeons, and during exploration, but limited to crude repairs, simple salves, emergency tonics, basic reinforced weapons, and unstable low-grade preparations.
  - **Alchemy room / medicine workbench**: required for higher-tier pills, impurity-cleansing tonics, foundation-stabilizing decoctions, safer batch refinement, and volatile herb processing.
  - **Blacksmithing room / forge**: required for spirit-grade weapons, armor upgrades, dungeon-loot refinement, metalwork repairs, and weapon variants that support specific combat arts.
  - Recipe availability should check both player skill and facility tier: skill proves knowledge; room/tools prove capacity.
  - Let players find or buy higher-tier ingredients before they can fully use them, creating anticipation for room access and upgrades.
  - Tie facility unlocks to sect contribution, NPC trust, Craft Hall / Medicine Hall reputation, town workshops, and room-base upgrades.
  - Support explorer exceptions: certain dungeon or field locations can temporarily enable special recipes when the environment itself provides the missing facility.
  - Later polish:
    - Location-based crafting access for Medicine Hall, Craft Hall forge, Iron Bridge blacksmith, room workbench, and dungeon special sites.
    - Explorer exception facilities such as ancient furnaces, spirit springs, battlefield forge remains, and Black-Thread Hollow ritual basins.
    - Recipe variants where field-kit versions are rougher, alchemy-room versions are safer, and advanced-room versions gain bonus effects.
    - Crafting quest hooks such as cleaning burners, sorting spirit coal, repairing broken tools, gathering volatile herbs, and helping Luo test flawed gear.
    - Higher tiers for Inner Sect / Foundation-stage crafting.
- [ ] Exploration polish: delayed search resolution
  - [x] First-pass delayed choice support added with timed progress text.
  - [x] Discovery result panel added for delayed searches that produce rewards, quest progress, or important findings.
  - [x] First tagged scenes:
    - South road wreckage searches and hidden token discovery.
    - Roadside healing-supply scavenging.
    - Lower grove careful search.
    - Ice-vein herb harvest at the cold north face.
    - Black-Thread Hollow entrance, rhythm, formation, chamber, and loot discoveries.
  - Add an optional animated countdown/progress bar for search, tracking, investigation, and uncertain exploration choices.
  - Example: player chooses "Search the lower grove carefully" → 3-second bar with investigation text → scene outcome resolves.
  - Keep it opt-in per choice so routine navigation and dialogue remain instant.
  - Support short staged text such as "Checking disturbed roots...", "Following qi traces...", "Listening for movement...".
  - Remaining work: tag more future wilderness, dungeon, and investigation scenes as they are added.
- [ ] Mortal Late → Peak breakthrough path
  - Impurity purification as primary gate (must reduce impurity below threshold)
  - Elder assessment scene
  - Dedicated purification activity in the room or medicine garden
- [ ] Phase 6 technique and enemy expansion
  - Technique: **Sunder-Heart Palm** — deals bonus damage based on enemy impurity / instability; rewards perception, opponent study, and medicine/cultivation knowledge.
  - Enemy: **Wall-Faced Remnant** — ghost of a cultivator who failed a breakthrough; acts as a narrative warning before the player's first true qi-stage ascent.
  - Use the Combat Prose Codex to make Mortal Peak feel oppressive, visibly qi-dense, and close to the edge of mortality.
- [ ] Technique synergy traits
  - Add hidden traits unlocked by mastering compatible techniques.
  - Example: **Steady Heart** from Azure Cloud Breathing 5 + Iron Body Method 5; improves breakthrough safety and resistance to pressure/fear effects.
  - Example: **Empty Pine Rhythm** from Pine Shadow Step 5 + Void Step 3; improves dodge/escape scenes and advanced movement checks.
- [ ] Skill EXP and bottleneck progression
  - [x] First-pass Skills tab UI shows EXP bars, progression state, training sources, benefits, and bottleneck preview text.
  - [x] Skill practice now caps at full EXP instead of auto-ranking, creating a real bottleneck state.
  - [x] At full EXP, higher-tier crafting recipes can become bottleneck attempts when all other requirements are met.
  - [x] Crafting bottlenecks begin near 20% success and improve after each failed attempt.
  - [x] On a successful higher-tier craft, all capped recipe skills rank up and reset their EXP.
  - [x] Skill breakthrough success/failure screens now show full-page art, result text, and rewards.
  - Add martial trial and field-test bottleneck attempts for non-crafting skills.
- [ ] Mortal Peak cultivation content
  - Increased technique mastery requirements
  - Qi circulation, meridian pressure, and impurity control become critical
  - Hints at what Qi Gathering will demand before Foundation Establishment is even possible
  - [x] Breakthroughs now record foundation quality and award tiered growth across core stats, max qi, max health, and long-term foundation flags.
  - [x] Cultivation panel now shows a breakthrough outlook with likely foundation quality, helpful signs, and risks without exposing the raw formula.
  - [x] Personal room now has a dedicated recovery action to reduce training fatigue before breakthrough attempts.
- [ ] Qi Gathering breakthrough
  - Chapter-ending narrative moment, not just a stat increment
  - Establishes **Qi Gathering** as the realm after Mortal Peak, creating a necessary bridge before Foundation Establishment.
  - Requires purified meridians, stable qi circulation, and a qi-grade resource from dungeon, town, sect, or crafted preparation.
  - Resource path split:
    - **Explorer**: Void Hollow Root can be refined into a risky qi-ascent catalyst with stronger affinity/story hooks, but raises impurity or instability during the attempt.
    - **Hermit**: Foundation-Stabilizing Decoction is reframed as a safer qi-circulation stabilizer that prepares the body for later Foundation Establishment.
  - The Wall-Faced Remnant should demonstrate impurity danger before this gate by using Sunder-Heart Palm against the player.
  - Changes available scenes, NPC reactions, sect standing, and available techniques.

### Phase 7 — Inner Sect Path
*Major story milestone; long-term goal for the sect arc*

- [ ] Inner sect assessment quest
- [ ] Inner sect area (different atmosphere — new NPCs, higher stakes, different visual tone)
- [ ] Inner disciple rivals and mentors
- [ ] Hermit / Explorer technique parity
  - Hermit path can trade time, sect contribution, and hall reputation for standardized sect techniques.
  - Explorer path finds ancient, corrupted, or lost variants with stronger risk/reward profiles.
  - Both paths must cover the same core combat roles so hermits are slower but never blocked from required progression.
- [ ] Inner sect techniques (significantly more powerful)
  - Standardized versions: safer, orthodox, easier to justify inside the sect.
  - Ancient/corrupted variants: higher ceiling, impurity/corruption/faction suspicion costs, stronger story hooks.
- [ ] Foundation Establishment preparation and breakthrough
  - Foundation Establishment becomes a later major milestone after Qi Gathering has been established.
  - Requires a true spirit-grade resource, stronger faction support, and a stable personal cultivation foundation.
  - Resource path split:
    - **Explorer**: dangerous ancient or dungeon-derived foundation material with higher ceiling, affinity hooks, and instability risk.
    - **Hermit**: orthodox sect-guided foundation material with safer results, steadier reputation gains, and fewer unusual bonuses.
  - Should change available scenes, NPC reactions, faction expectations, and board access more dramatically than earlier breakthroughs.
- [ ] Sect politics and faction content
  - Prefer group social scores over one-off flags: Discipline Hall, Medicine Hall, Sword Hall, Scripture Pavilion, Outer Affairs, etc.
  - Use specific flags only for irreversible story events; use faction scores for repeatable access, reactions, prices, and quest availability.
- [ ] Faction quest board evolution
  - Upgrade the current static quest board into hall/faction boards using `scene.boardImage` and reputation-gated notices.
  - Board art and available papers can change by sect rank, phase, and faction score.
  - Add conditional board image selection in priority order, such as warning/vandalized boards for hostile factions or jade notice boards for Foundation Establishment quests.
  - Avoid true soft locks: hostile faction boards should hide normal work but always show at least one recovery route, apology task, duel challenge, contribution payment, or reputation repair quest.
  - Use quest-board changes to show politics visually without needing dozens of near-duplicate scenes.

---

## Design Principles

- **Two valid paths**: hermit (sect cultivation) and explorer (dungeons/towns) both reach the same progression gates, but at different speeds. The explorer is faster; the hermit is slower but never blocked.
- **Technique parity, different flavor**: hermits earn standardized orthodox tools through time, contribution, and reputation; explorers find stranger variants with higher risk, higher ceiling, and more story consequences.
- **Faction scores over flag explosions**: use relationships, reputation, morality, and sect contribution for broad political state; reserve flags for specific events that truly happened or did not happen.
- **World feels large**: new areas, towns, and dungeons should hint at even larger places beyond them. The player should always feel there is more to find.
- **Story over grinding**: every activity should have writing attached to it. Stat gains should come with a sentence that makes them feel earned.
- **Breakthroughs are chapter endings**: each realm/stage advance should feel like a narrative moment, not a menu transaction.
- **Power progression is visible**: combat narration, technique descriptions, and NPC reactions should all reflect the player's cultivation level. Getting stronger should feel different, not just number-bigger.
