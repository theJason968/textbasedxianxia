# Xianxia Text Adventure

A React + TypeScript text RPG prototype with JSON-driven scenes, items, and techniques.

## Current Milestone

Project setup for the first playable arc: the Azure Cloud Sect outer disciple trial.

## Planned Build Order

1. Game state
2. Scene display
3. Multiple-choice selection
4. Choice effects
5. Choice conditions
6. Inventory
7. Techniques
8. Save/load
9. Cultivation progression
10. Combat
11. Quests
12. Art placeholders

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Writing References

- [Combat Prose Codex](docs/Combat_Prose_Codex.md) defines power-tier narration, cross-tier fight scaling, and technique-specific prose rules for future combat scenes.

## Writing Conditional Choices

Choices can use `outcomes` when the same visible option should resolve differently
based on the disciple's current state. Outcomes are checked from top to bottom, and
the first matching `requires` block wins. Put a final outcome with no `requires` at
the bottom as the fallback.

```json
{
  "label": "Search the lower grove carefully",
  "nextScene": "lower_grove_success",
  "outcomes": [
    {
      "requires": { "stats": { "spiritualSense": 2 } },
      "nextScene": "lower_grove_hidden_cache"
    },
    {
      "nextScene": "lower_grove_thorn_snare"
    }
  ]
}
```

## Writing Skill Tree Hooks

Player skill levels live on `player.skills`, and practice progress toward the
next level lives on `player.skillPractice`. Scene effects use `addSkills` to
practice a skill. The first practice unlocks Novice; after that, three practice
points raise the skill by one level. Choices or outcomes can require minimum
levels with `skills`.
Ranks display as named skill levels:

1. Novice
2. Intermediate
3. Skilled
4. Expert

```json
{
  "effects": {
    "addSkills": {
      "herb_recognition": 1,
      "crude_elixir_refining": 1
    }
  }
}
```

```json
{
  "requires": {
    "skills": {
      "iron_sense": 1
    }
  }
}
```

## Writing Memorable NPCs

Recurring NPCs live in `src/data/npcs.json`. Use this file as the story bible
for characters who should return later, remember the player, teach skills, or
anchor quests. NPC `skills` use the same rank scale as player skills:

1. Novice
2. Intermediate
3. Skilled
4. Expert

Reference scene ids in `firstSceneId`, quest ids in `associatedQuests`, and
important player memory flags in `memoryFlags`. Use `returnHooks` for future
story ideas that can bring the NPC back naturally.
