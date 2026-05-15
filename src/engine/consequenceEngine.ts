import type {
  Choice,
  ChoiceEffect,
  ElementalEssence,
  Enemy,
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
import {
  formatSkillEffectSummary,
  getSkillLevelName,
  skillPracticesPerLevel,
} from "./skillEngine";
import enemies from "../data/enemies.json";
import items from "../data/items.json";
import quests from "../data/quests.json";
import skills from "../data/skills.json";
import techniques from "../data/techniques.json";
import craftingRecipes from "../data/craftingRecipes.json";

type NumericPlayerStat = {
  [Key in keyof Player]: Player[Key] extends number ? Key : never;
}[keyof Player];

type NumericEffects = Partial<Record<NumericPlayerStat, number>>;
type ChoiceResult = {
  gameState: GameState;
  messages: string[];
};

const mortalRepairBundleId = "mortal_repair_bundle";
const mortalRepairBundlePieces = [
  "family_sewing_roll",
  "aunt_lins_herb_papers",
  "guos_wire_and_rivets",
  "old_rens_road_knife",
];

const numericEffectKeys: NumericPlayerStat[] = [
  "health",
  "qi",
  "strength",
  "agility",
  "endurance",
  "intelligence",
  "perception",
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
  "corruption",
];
const skillData = skills as Skill[];
const enemyData = enemies as Enemy[];
const itemData = items as Array<{ id: string; name: string }>;
const techniqueData = techniques as Array<{ id: string; name: string }>;
const questData = quests as Array<{ id: string; name: string }>;
const recipeData = craftingRecipes as Array<{ id: string; name: string }>;
const playerChangeKeys: Array<keyof Pick<
  Player,
  | "health"
  | "maxHealth"
  | "qi"
  | "maxQi"
  | "strength"
  | "agility"
  | "endurance"
  | "intelligence"
  | "perception"
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
  | "corruption"
>> = [
  "health",
  "maxHealth",
  "qi",
  "maxQi",
  "strength",
  "agility",
  "endurance",
  "intelligence",
  "perception",
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
  "corruption",
];
const playerStatLabels: Record<(typeof playerChangeKeys)[number], string> = {
  health: "Health",
  maxHealth: "Maximum Health",
  qi: "Qi",
  maxQi: "Maximum Qi",
  strength: "Strength",
  agility: "Agility",
  endurance: "Endurance",
  intelligence: "Intelligence",
  perception: "Perception",
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
  corruption: "Corruption",
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
      messages: getChoiceResultMessages(gameState.player, player, outcome.effects),
    };
  }

  const enemy = enemyData.find(
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
    messages: getChoiceResultMessages(gameState.player, player, outcome.effects),
  };
}

function getChoiceResultMessages(
  previousPlayer: Player,
  nextPlayer: Player,
  effects?: ChoiceEffect,
): string[] {
  return [...(effects?.messages ?? []), ...getPlayerChangeMessages(previousPlayer, nextPlayer)];
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
    ...getRecipeMessages(previousPlayer, nextPlayer),
    ...getTechniqueMessages(previousPlayer, nextPlayer),
    ...getTechniqueMasteryMessages(previousPlayer, nextPlayer),
    ...getSkillMessages(previousPlayer, nextPlayer),
    ...getElementMessages(previousPlayer, nextPlayer),
    ...getConstitutionMessages(previousPlayer, nextPlayer),
    ...getQuestMessages(previousPlayer, nextPlayer),
    ...getSocialScoreMessages("Relationship", previousPlayer.relationships, nextPlayer.relationships),
    ...getSocialScoreMessages("Reputation", previousPlayer.reputation, nextPlayer.reputation),
    ...getSocialScoreMessages("Morality", previousPlayer.morality, nextPlayer.morality),
    ...getSocialScoreMessages(
      "Sect Contribution",
      previousPlayer.sectContribution,
      nextPlayer.sectContribution,
    ),
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
    inventory: assembleMortalRepairBundle(mergeUnique(player.inventory, effects.addItems)),
    knownRecipes: mergeUnique(player.knownRecipes, effects.learnRecipes),
    equipment: equipRewardedItem(player.equipment, effects),
    techniques: mergeUnique(player.techniques, effects.learnTechniques),
    ...applySkillPractice(player, effects.addSkills),
    elementalEssence: mergeElementalEssence(
      player.elementalEssence,
      effects.addElements,
    ),
    constitutions: mergeUnique(player.constitutions, effects.awakenConstitutions),
    techniqueMastery: mergeTechniqueMastery(
      player.techniqueMastery,
      effects.techniqueMastery,
    ),
    npcJournal: updateNpcJournal(player.npcJournal, effects),
    relationships: mergeSocialScores(player.relationships, effects.relationships),
    reputation: mergeSocialScores(player.reputation, effects.reputation),
    morality: mergeSocialScores(player.morality, effects.morality),
    sectContribution: mergeSocialScores(
      player.sectContribution,
      effects.sectContribution,
    ),
    flags: {
      ...player.flags,
      ...effects.setFlags,
    },
  };

  return awakenEligibleConstitutions(
    applyBreakthroughEffect(applyQuestEffects(playerWithBasicEffects, effects), effects),
  );
}

function applyBreakthroughEffect(
  player: Player,
  effects: NonNullable<Choice["effects"]>,
): Player {
  if (!effects.breakthrough) {
    return player;
  }

  const maxHealthIncrease = effects.breakthrough.maxHealthIncrease ?? 0;

  return {
    ...player,
    realm: effects.breakthrough.realm ?? player.realm,
    stage: effects.breakthrough.stage,
    qi: 0,
    maxQi: player.maxQi + (effects.breakthrough.maxQiIncrease ?? 0),
    maxHealth: player.maxHealth + maxHealthIncrease,
    health: Math.min(player.health + maxHealthIncrease, player.maxHealth + maxHealthIncrease),
    spiritualSense:
      player.spiritualSense + (effects.breakthrough.spiritualSenseIncrease ?? 0),
    foundationStability: Math.max(
      0,
      player.foundationStability - (effects.breakthrough.foundationCost ?? 0),
    ),
    trainingFatigue: Math.max(0, player.trainingFatigue - 2),
  };
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

function mergeUnique(current: string[] = [], additions: string[] = []): string[] {
  return [...new Set([...current, ...additions])];
}

function assembleMortalRepairBundle(inventory: string[]): string[] {
  if (inventory.includes(mortalRepairBundleId)) {
    return inventory;
  }

  const hasEveryPiece = mortalRepairBundlePieces.every((itemId) =>
    inventory.includes(itemId),
  );

  return hasEveryPiece ? [...inventory, mortalRepairBundleId] : inventory;
}

function mergeSocialScores(
  currentScores: Player["relationships"],
  scoreChanges: Player["relationships"] = {},
): Player["relationships"] {
  return Object.entries(scoreChanges).reduce<Player["relationships"]>(
    (nextScores, [scoreId, change]) => ({
      ...nextScores,
      [scoreId]: (nextScores[scoreId] ?? 0) + change,
    }),
    { ...currentScores },
  );
}

function equipRewardedItem(
  equipment: Player["equipment"],
  effects: ChoiceEffect,
): Player["equipment"] {
  if (!effects.equipItem) {
    return equipment;
  }

  return {
    ...equipment,
    [effects.equipItem.slot]: effects.equipItem.itemId,
  };
}

function updateNpcJournal(
  currentJournal: Player["npcJournal"],
  effects: ChoiceEffect,
): Player["npcJournal"] {
  const npcIds = [
    effects.meetNpc,
    effects.recordNpcConversation?.npcId,
  ].filter((npcId) => npcId !== undefined);

  if (npcIds.length <= 0) {
    return currentJournal;
  }

  const nextJournal = { ...currentJournal };

  npcIds.forEach((npcId) => {
    nextJournal[npcId] = nextJournal[npcId] ?? {
      met: true,
      conversations: [],
    };
    nextJournal[npcId] = {
      ...nextJournal[npcId],
      met: true,
    };
  });

  if (effects.recordNpcConversation) {
    const { npcId, topic } = effects.recordNpcConversation;
    const conversations = nextJournal[npcId]?.conversations ?? [];

    nextJournal[npcId] = {
      met: true,
      conversations: mergeUnique(conversations, [topic]),
    };
  }

  return nextJournal;
}

function applySkillPractice(
  player: Player,
  practiceChanges: Player["skills"] = {},
): Pick<Player, "skills" | "skillPractice"> {
  return Object.entries(practiceChanges).reduce<Pick<Player, "skills" | "skillPractice">>(
    (nextSkillState, [skillId, practiceGain]) => {
      let nextRank = nextSkillState.skills[skillId] ?? 0;
      let nextPractice = nextSkillState.skillPractice[skillId] ?? 0;
      const maxRank = getSkillMaxRank(skillId);

      if (practiceGain <= 0 || nextRank >= maxRank) {
        return nextSkillState;
      }

      if (nextRank <= 0) {
        nextRank = 1;
        practiceGain -= 1;
      }

      if (practiceGain > 0 && nextRank < maxRank) {
        nextPractice += practiceGain;

        while (nextPractice >= skillPracticesPerLevel && nextRank < maxRank) {
          nextPractice -= skillPracticesPerLevel;
          nextRank += 1;
        }
      }

      if (nextRank >= maxRank) {
        nextPractice = 0;
      }

      return {
        skills: {
          ...nextSkillState.skills,
          [skillId]: clampSkillRank(skillId, nextRank),
        },
        skillPractice: {
          ...nextSkillState.skillPractice,
          [skillId]: Math.max(0, nextPractice),
        },
      };
    },
    {
      skills: { ...player.skills },
      skillPractice: { ...player.skillPractice },
    },
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
  return Math.min(getSkillMaxRank(skillId), Math.max(0, value));
}

function getSkillMaxRank(skillId: string): number {
  return skillData.find((candidate) => candidate.id === skillId)?.maxRank ?? 4;
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
  const examKnown = nextPlayer.flags.learned_about_azure_cloud_exam === true;

  if (!examKnown) {
    return [];
  }

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

      if (
        key === "qi" &&
        change > 0 &&
        !previousPlayer.techniques.includes("azure_cloud_breathing")
      ) {
        if (previousPlayer.qi <= 0) {
          return `For the first time, rough qi warms the body. It does not gather like true cultivation; it tempers flesh, breath, and bone.`;
        }

        return `Character absorbed +${change} rough qi for body tempering.`;
      }

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

function getRecipeMessages(previousPlayer: Player, nextPlayer: Player): string[] {
  return (nextPlayer.knownRecipes ?? [])
    .filter((recipeId) => !(previousPlayer.knownRecipes ?? []).includes(recipeId))
    .map((recipeId) => {
      const recipeName = recipeData.find((recipe) => recipe.id === recipeId)?.name ?? recipeId;

      return `Recipe learned: ${recipeName}.`;
    });
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
      const practiceGain =
        (nextPlayer.skillPractice[skillId] ?? 0) -
        (previousPlayer.skillPractice[skillId] ?? 0);

      const skill = skillData.find((candidate) => candidate.id === skillId);
      const skillName = skill?.name ?? skillId;
      const treeName = skill?.tree ?? "Skill";
      const nextRank = nextPlayer.skills[skillId] ?? 0;
      const levelName = getSkillLevelName(nextRank);
      const effectSummary = skill ? formatSkillEffectSummary(skill, nextRank) : "";

      if (rankGain <= 0) {
        if (practiceGain <= 0 || !skill || nextRank >= skill.maxRank) {
          return null;
        }

        return `Character practiced ${treeName}: ${skillName} (${nextPlayer.skillPractice[skillId]}/${skillPracticesPerLevel} to ${getSkillLevelName(
          nextRank + 1,
        )}).`;
      }

      return `Character reached ${levelName} ${treeName}: ${skillName}${
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

function getSocialScoreMessages(
  scoreType: string,
  previousScores: Player["relationships"] = {},
  nextScores: Player["relationships"] = {},
): string[] {
  return Object.entries(nextScores)
    .map(([scoreId, nextValue]) => {
      const change = nextValue - (previousScores[scoreId] ?? 0);

      if (change === 0) {
        return null;
      }

      const label = formatSocialScoreLabel(scoreId);

      return change > 0
        ? `${scoreType} increased: ${label} +${change}.`
        : `${scoreType} decreased: ${label} ${change}.`;
    })
    .filter((message) => message !== null);
}

function formatSocialScoreLabel(scoreId: string): string {
  return scoreId
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    key === "corruption" ||
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
