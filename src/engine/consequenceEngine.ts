import type {
  Choice,
  ChoiceEffect,
  ElementalEssence,
  GameState,
  Player,
  Skill,
} from "./types";
import { startCombat } from "./combatEngine";
import {
  awakenEligibleConstitutions,
  getConstitutionName,
  getElementLabel,
} from "./constitutionEngine";
import { completeQuest, failQuest, startQuest, updateQuest } from "./questEngine";
import { meetsRequirements } from "./conditionEngine";
import { formatSkillEffectSummary } from "./skillEngine";
import enemies from "../data/enemies.json";
import items from "../data/items.json";
import quests from "../data/quests.json";
import skills from "../data/skills.json";
import techniques from "../data/techniques.json";

type NumericPlayerStat = {
  [Key in keyof Player]: Player[Key] extends number ? Key : never;
}[keyof Player];

type NumericEffects = Partial<Record<NumericPlayerStat, number>>;
type ChoiceResult = {
  gameState: GameState;
  messages: string[];
};

const numericEffectKeys: NumericPlayerStat[] = [
  "health",
  "qi",
  "spiritualSense",
  "physique",
  "comprehension",
  "willpower",
  "karma",
  "foundationStability",
  "trainingFatigue",
  "impurity",
  "cultivationInsight",
  "daysRemainingToExam",
  "spiritStones",
];
const skillData = skills as Skill[];
const itemData = items as Array<{ id: string; name: string }>;
const techniqueData = techniques as Array<{ id: string; name: string }>;
const questData = quests as Array<{ id: string; name: string }>;
const playerChangeKeys: Array<keyof Pick<
  Player,
  | "health"
  | "maxHealth"
  | "qi"
  | "maxQi"
  | "spiritualSense"
  | "physique"
  | "comprehension"
  | "willpower"
  | "karma"
  | "foundationStability"
  | "trainingFatigue"
  | "impurity"
  | "cultivationInsight"
  | "spiritStones"
>> = [
  "health",
  "maxHealth",
  "qi",
  "maxQi",
  "spiritualSense",
  "physique",
  "comprehension",
  "willpower",
  "karma",
  "foundationStability",
  "trainingFatigue",
  "impurity",
  "cultivationInsight",
  "spiritStones",
];
const playerStatLabels: Record<(typeof playerChangeKeys)[number], string> = {
  health: "Health",
  maxHealth: "Maximum Health",
  qi: "Qi",
  maxQi: "Maximum Qi",
  spiritualSense: "Spiritual Sense",
  physique: "Physique",
  comprehension: "Comprehension",
  willpower: "Willpower",
  karma: "Karma",
  foundationStability: "Foundation Stability",
  trainingFatigue: "Training Fatigue",
  impurity: "Impurity",
  cultivationInsight: "Cultivation Insight",
  spiritStones: "Spirit Stones",
};

export function applyChoice(gameState: GameState, choice: Choice): GameState {
  return applyChoiceWithResult(gameState, choice).gameState;
}

export function applyChoiceWithResult(
  gameState: GameState,
  choice: Choice,
): ChoiceResult {
  const outcome = resolveChoiceOutcome(gameState, choice);
  const player = applyEffects(gameState.player, outcome.effects);
  const currentSceneId =
    outcome.effects?.deadlineScene && player.daysRemainingToExam <= 0
      ? outcome.effects.deadlineScene
      : outcome.nextScene;
  const nextGameState = {
    ...gameState,
    currentSceneId,
    player,
  };

  if (!outcome.effects?.startCombat) {
    return {
      gameState: nextGameState,
      messages: getPlayerChangeMessages(gameState.player, player),
    };
  }

  const enemy = enemies.find(
    (candidate) => candidate.id === outcome.effects?.startCombat?.enemyId,
  );

  if (!enemy) {
    throw new Error(`Enemy not found: ${outcome.effects.startCombat.enemyId}`);
  }

  return {
    gameState: startCombat(
      nextGameState,
      enemy,
      outcome.effects.startCombat.victorySceneId,
      outcome.effects.startCombat.defeatSceneId,
    ),
    messages: getPlayerChangeMessages(gameState.player, player),
  };
}

export function getPlayerChangeMessages(
  previousPlayer: Player,
  nextPlayer: Player,
): string[] {
  return [
    ...getRealmMessages(previousPlayer, nextPlayer),
    ...getTimeMessages(previousPlayer, nextPlayer),
    ...getNumericStatMessages(previousPlayer, nextPlayer),
    ...getInventoryMessages(previousPlayer, nextPlayer),
    ...getTechniqueMessages(previousPlayer, nextPlayer),
    ...getTechniqueMasteryMessages(previousPlayer, nextPlayer),
    ...getSkillMessages(previousPlayer, nextPlayer),
    ...getElementMessages(previousPlayer, nextPlayer),
    ...getConstitutionMessages(previousPlayer, nextPlayer),
    ...getQuestMessages(previousPlayer, nextPlayer),
  ];
}

function resolveChoiceOutcome(
  gameState: GameState,
  choice: Choice,
): { nextScene: string; effects?: ChoiceEffect } {
  const matchedOutcome = choice.outcomes?.find((outcome) =>
    meetsRequirements(gameState, outcome.requires),
  );

  return matchedOutcome ?? { nextScene: choice.nextScene, effects: choice.effects };
}

function applyEffects(player: Player, effects?: ChoiceEffect): Player {
  if (!effects) {
    return player;
  }

  const numericEffects = effects as NumericEffects;
  const numericEffectsWithTime = {
    ...numericEffects,
    daysRemainingToExam:
      (numericEffects.daysRemainingToExam ?? 0) - (effects.advanceDays ?? 0),
  };
  const statChanges = numericEffectKeys.reduce<NumericEffects>((changes, key) => {
    const change = numericEffectsWithTime[key];

    if (typeof change === "number") {
      changes[key] = clampPlayerStat(player, key, player[key] + change);
    }

    return changes;
  }, {});

  const playerWithBasicEffects: Player = {
    ...player,
    ...statChanges,
    inventory: mergeUnique(player.inventory, effects.addItems),
    techniques: mergeUnique(player.techniques, effects.learnTechniques),
    skills: mergeSkillRanks(player.skills, effects.addSkills),
    elementalEssence: mergeElementalEssence(
      player.elementalEssence,
      effects.addElements,
    ),
    constitutions: mergeUnique(player.constitutions, effects.awakenConstitutions),
    techniqueMastery: mergeTechniqueMastery(
      player.techniqueMastery,
      effects.techniqueMastery,
    ),
    flags: {
      ...player.flags,
      ...effects.setFlags,
    },
  };

  return awakenEligibleConstitutions(applyQuestEffects(playerWithBasicEffects, effects));
}

function applyQuestEffects(player: Player, effects: NonNullable<Choice["effects"]>): Player {
  let nextPlayer = player;

  if (effects.startQuest) {
    nextPlayer = startQuest(nextPlayer, effects.startQuest);
  }

  if (effects.updateQuest) {
    nextPlayer = updateQuest(
      nextPlayer,
      effects.updateQuest.questId,
      effects.updateQuest.step,
    );
  }

  if (effects.completeQuest) {
    nextPlayer = completeQuest(nextPlayer, effects.completeQuest);
  }

  if (effects.failQuest) {
    nextPlayer = failQuest(nextPlayer, effects.failQuest);
  }

  return nextPlayer;
}

function mergeUnique(current: string[], additions: string[] = []): string[] {
  return [...new Set([...current, ...additions])];
}

function mergeSkillRanks(
  currentSkills: Player["skills"],
  skillChanges: Player["skills"] = {},
): Player["skills"] {
  return Object.entries(skillChanges).reduce<Player["skills"]>(
    (nextSkills, [skillId, change]) => ({
      ...nextSkills,
      [skillId]: clampSkillRank(skillId, (nextSkills[skillId] ?? 0) + change),
    }),
    { ...currentSkills },
  );
}

function mergeElementalEssence(
  currentElements: Player["elementalEssence"],
  elementChanges: Player["elementalEssence"] = {},
): Player["elementalEssence"] {
  return Object.entries(elementChanges).reduce<Player["elementalEssence"]>(
    (nextElements, [element, change]) => ({
      ...nextElements,
      [element]: Math.max(
        0,
        (nextElements[element as ElementalEssence] ?? 0) + change,
      ),
    }),
    { ...currentElements },
  );
}

function clampSkillRank(skillId: string, value: number): number {
  const skill = skillData.find((candidate) => candidate.id === skillId);
  const maxRank = skill?.maxRank ?? Number.MAX_SAFE_INTEGER;

  return Math.min(maxRank, Math.max(0, value));
}

function getRealmMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  if (
    previousPlayer.realm === nextPlayer.realm &&
    previousPlayer.stage === nextPlayer.stage
  ) {
    return [];
  }

  return [`Character advanced to ${nextPlayer.realm} ${nextPlayer.stage}.`];
}

function getTimeMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  const dayChange = previousPlayer.daysRemainingToExam - nextPlayer.daysRemainingToExam;

  if (dayChange > 0) {
    return [`${dayChange} day${dayChange === 1 ? "" : "s"} passed before the exam.`];
  }

  if (dayChange < 0) {
    const gainedDays = Math.abs(dayChange);

    return [`Exam time increased by ${gainedDays} day${gainedDays === 1 ? "" : "s"}.`];
  }

  return [];
}

function getNumericStatMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return playerChangeKeys
    .map((key) => {
      const change = nextPlayer[key] - previousPlayer[key];

      if (change === 0) {
        return null;
      }

      const label = playerStatLabels[key];

      if (change > 0) {
        return `Character gained +${change} ${label}.`;
      }

      return `Character lost ${Math.abs(change)} ${label}.`;
    })
    .filter((message) => message !== null);
}

function getInventoryMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return getAddedCounts(previousPlayer.inventory, nextPlayer.inventory).map(
    ([itemId, count]) => {
      const itemName = itemData.find((item) => item.id === itemId)?.name ?? itemId;

      return `Character gained ${count > 1 ? `${count} ` : ""}${itemName}.`;
    },
  );
}

function getTechniqueMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return nextPlayer.techniques
    .filter((techniqueId) => !previousPlayer.techniques.includes(techniqueId))
    .map((techniqueId) => {
      const techniqueName =
        techniqueData.find((technique) => technique.id === techniqueId)?.name ??
        techniqueId;

      return `Character learned ${techniqueName}.`;
    });
}

function getTechniqueMasteryMessages(
  previousPlayer: Player,
  nextPlayer: Player,
): string[] {
  return Object.entries(nextPlayer.techniqueMastery)
    .map(([techniqueId, nextRank]) => {
      const rankGain = nextRank - (previousPlayer.techniqueMastery[techniqueId] ?? 0);

      if (rankGain <= 0) {
        return null;
      }

      const techniqueName =
        techniqueData.find((technique) => technique.id === techniqueId)?.name ??
        techniqueId;

      return `Character gained +${rankGain} ${techniqueName} mastery.`;
    })
    .filter((message) => message !== null);
}

function getSkillMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return Object.keys(nextPlayer.skills)
    .map((skillId) => {
      const rankGain = (nextPlayer.skills[skillId] ?? 0) - (previousPlayer.skills[skillId] ?? 0);

      if (rankGain <= 0) {
        return null;
      }

      const skill = skillData.find((candidate) => candidate.id === skillId);
      const skillName = skill?.name ?? skillId;
      const treeName = skill?.tree ?? "Skill";
      const effectSummary = skill ? formatSkillEffectSummary(skill, rankGain) : "";

      return `Character has learned +${rankGain} ${treeName}: ${skillName}${
        effectSummary ? ` (${effectSummary})` : ""
      }.`;
    })
    .filter((message) => message !== null);
}

function getElementMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return Object.entries(nextPlayer.elementalEssence)
    .map(([element, nextAmount]) => {
      const gain =
        nextAmount - (previousPlayer.elementalEssence[element as ElementalEssence] ?? 0);

      if (gain <= 0) {
        return null;
      }

      return `Body stored +${gain} ${getElementLabel(element as ElementalEssence)}.`;
    })
    .filter((message) => message !== null);
}

function getConstitutionMessages(
  previousPlayer: Player,
  nextPlayer: Player,
): string[] {
  return nextPlayer.constitutions
    .filter((constitutionId) => !previousPlayer.constitutions.includes(constitutionId))
    .map(
      (constitutionId) =>
        `Special constitution awakened: ${getConstitutionName(constitutionId)}.`,
    );
}

function getQuestMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return Object.entries(nextPlayer.quests)
    .map(([questId, nextQuest]) => {
      const previousQuest = previousPlayer.quests[questId];
      const questName = questData.find((quest) => quest.id === questId)?.name ?? questId;

      if (!previousQuest) {
        return `Quest started: ${questName}.`;
      }

      if (previousQuest.status !== nextQuest.status) {
        return `Quest ${nextQuest.status}: ${questName}.`;
      }

      if (previousQuest.step !== nextQuest.step) {
        return `Quest updated: ${questName}.`;
      }

      return null;
    })
    .filter((message) => message !== null);
}

function getAddedCounts(previousValues: string[], nextValues: string[]): Array<[string, number]> {
  const previousCounts = countValues(previousValues);
  const nextCounts = countValues(nextValues);

  return Object.entries(nextCounts)
    .map<[string, number]>(([value, count]) => [
      value,
      count - (previousCounts[value] ?? 0),
    ])
    .filter(([, count]) => count > 0);
}

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>(
    (counts, value) => ({
      ...counts,
      [value]: (counts[value] ?? 0) + 1,
    }),
    {},
  );
}

function mergeTechniqueMastery(
  currentMastery: Player["techniqueMastery"],
  masteryChanges: Player["techniqueMastery"] = {},
): Player["techniqueMastery"] {
  return Object.entries(masteryChanges).reduce<Player["techniqueMastery"]>(
    (nextMastery, [techniqueId, change]) => ({
      ...nextMastery,
      [techniqueId]: Math.max(0, (nextMastery[techniqueId] ?? 0) + change),
    }),
    { ...currentMastery },
  );
}

function clampPlayerStat(player: Player, key: NumericPlayerStat, value: number): number {
  if (
    key === "health" ||
    key === "qi" ||
    key === "foundationStability" ||
    key === "trainingFatigue" ||
    key === "impurity" ||
    key === "cultivationInsight" ||
    key === "daysRemainingToExam"
  ) {
    const lowerBoundedValue = Math.max(0, value);

    if (key === "health") {
      return Math.min(player.maxHealth, lowerBoundedValue);
    }

    if (key === "qi") {
      return Math.min(player.maxQi, lowerBoundedValue);
    }

    if (key === "foundationStability") {
      return Math.min(100, lowerBoundedValue);
    }

    if (key === "daysRemainingToExam") {
      return Math.max(0, lowerBoundedValue);
    }

    return lowerBoundedValue;
  }

  return value;
}
