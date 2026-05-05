import type { GameState } from "./types";

export function createInitialGameState(): GameState {
  return {
    currentSceneId: "pre_exam_days",
    combat: null,
    player: {
      name: "Unnamed Disciple",
      realm: "Mortal",
      stage: "Early",
      health: 30,
      maxHealth: 30,
      qi: 0,
      maxQi: 20,
      spiritualSense: 1,
      physique: 1,
      comprehension: 1,
      willpower: 1,
      karma: 0,
      foundationStability: 100,
      trainingFatigue: 0,
      impurity: 0,
      cultivationInsight: 0,
      daysRemainingToExam: 10,
      spiritStones: 0,
      inventory: [],
      techniques: [],
      skills: {},
      elementalEssence: {},
      constitutions: [],
      techniqueMastery: {},
      quests: {},
      flags: {},
    },
  };
}
