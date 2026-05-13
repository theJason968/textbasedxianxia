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
- Skill system (practice → rank progression)
- Technique system (learn + mastery tracking)
- Breakthrough system (realm/stage advancement with stat costs)
- Elemental essence and constitution awakening
- NPC journal (meet + conversation log)
- Social scores (relationships, reputation, morality, sect contribution)
- Interactive quest board (2D image with hover tooltips and click-to-accept)
- Room base system (upgradeable activities: cultivation, study, herb shelf, journal)
- Condition engine supports: stats, flags, flagsAbsent, items, techniques, techniqueMastery, skills, elements, realm/stage, relationships, reputation

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
- **3 crafting recipes** — very limited variety
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
- [ ] Recipe unlock scenes tied to NPCs and crafting locations

### Phase 6 — Mortal Peak Arc
*Central dramatic arc of the mortal stage*

- [ ] Mortal Late → Peak breakthrough path
  - Impurity purification as primary gate (must reduce impurity below threshold)
  - Elder assessment scene
  - Dedicated purification activity in the room or medicine garden
- [ ] Mortal Peak cultivation content
  - Increased technique mastery requirements
  - Foundation stability becomes critical
  - Hints at what Foundation Establishment will demand
- [ ] Foundation Establishment breakthrough
  - Chapter-ending narrative moment, not just a stat increment
  - Requires a spirit-grade resource from a dungeon or town source
  - Changes available scenes, NPC reactions, and sect standing

### Phase 7 — Inner Sect Path
*Major story milestone; long-term goal for the sect arc*

- [ ] Inner sect assessment quest
- [ ] Inner sect area (different atmosphere — new NPCs, higher stakes, different visual tone)
- [ ] Inner disciple rivals and mentors
- [ ] Inner sect techniques (significantly more powerful)
- [ ] Sect politics and faction content

---

## Design Principles

- **Two valid paths**: hermit (sect cultivation) and explorer (dungeons/towns) both reach the same progression gates, but at different speeds. The explorer is faster; the hermit is slower but never blocked.
- **World feels large**: new areas, towns, and dungeons should hint at even larger places beyond them. The player should always feel there is more to find.
- **Story over grinding**: every activity should have writing attached to it. Stat gains should come with a sentence that makes them feel earned.
- **Breakthroughs are chapter endings**: each realm/stage advance should feel like a narrative moment, not a menu transaction.
- **Power progression is visible**: combat narration, technique descriptions, and NPC reactions should all reflect the player's cultivation level. Getting stronger should feel different, not just number-bigger.
