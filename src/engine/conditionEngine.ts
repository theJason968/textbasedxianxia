import type { Choice, ChoiceRequirement, GameState, Player } from "./types";

type NumericPlayerStat = {
  [Key in keyof Player]: Player[Key] extends number ? Key : never;
}[keyof Player];

type NumericRequirements = Partial<Record<NumericPlayerStat, number>>;

export function getAvailableChoices(gameState: GameState, choices: Choice[]): Choice[] {
  return choices.filter((choice) => canChoose(gameState, choice));
}

export function canChoose(gameState: GameState, choice: Choice): boolean {
  return meetsRequirements(gameState, choice.requires);
}

export function meetsRequirements(
  gameState: GameState,
  requirements?: ChoiceRequirement,
): boolean {
  const { player } = gameState;

  if (!requirements) {
    return true;
  }

  if (requirements.realm && player.realm !== requirements.realm) {
    return false;
  }

  if (requirements.stage && player.stage !== requirements.stage) {
    return false;
  }

  if (!meetsStatRequirements(player, requirements.stats)) {
    return false;
  }

  if (!hasEvery(player.inventory, requirements.items)) {
    return false;
  }

  if (!hasEvery(player.techniques, requirements.techniques)) {
    return false;
  }

  if (!hasRequiredSkillRanks(player.skills, requirements.skills)) {
    return false;
  }

  if (!hasRequiredElementalEssence(player.elementalEssence, requirements.elements)) {
    return false;
  }

  if (!hasEvery(player.constitutions, requirements.constitutions)) {
    return false;
  }

  if (!hasMatchingFlags(player.flags, requirements.flags)) {
    return false;
  }

  return true;
}

function meetsStatRequirements(
  player: Player,
  stats: NumericRequirements = {},
): boolean {
  return Object.entries(stats).every(([key, requiredValue]) => {
    const statKey = key as NumericPlayerStat;

    return player[statKey] >= requiredValue;
  });
}

function hasEvery(currentValues: string[], requiredValues: string[] = []): boolean {
  return requiredValues.every((requiredValue) => currentValues.includes(requiredValue));
}

function hasRequiredSkillRanks(
  currentSkills: Player["skills"],
  requiredSkills: Player["skills"] = {},
): boolean {
  return Object.entries(requiredSkills).every(
    ([skillId, requiredRank]) => (currentSkills[skillId] ?? 0) >= requiredRank,
  );
}

function hasRequiredElementalEssence(
  currentElements: Player["elementalEssence"],
  requiredElements: Player["elementalEssence"] = {},
): boolean {
  return Object.entries(requiredElements).every(
    ([element, requiredAmount]) => (currentElements[element as keyof typeof currentElements] ?? 0) >= requiredAmount,
  );
}

function hasMatchingFlags(
  currentFlags: Player["flags"],
  requiredFlags: Player["flags"] = {},
): boolean {
  return Object.entries(requiredFlags).every(
    ([key, requiredValue]) => currentFlags[key] === requiredValue,
  );
}
