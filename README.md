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

Player skill ranks live on `player.skills`. Scene effects can grant ranks with
`addSkills`, and choices or outcomes can require minimum ranks with `skills`.

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
