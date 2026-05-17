import skills from "../data/skills.json";
import {
  getSkillBottleneckSuccessChance,
  isSkillAtBottleneck,
} from "./skillEngine";
import type { GameState, ItemTier, Player, Skill, SkillTree } from "./types";

export type CraftingFacility = "field_kit" | "alchemy_room" | "blacksmithing_room";
export type CraftingFacilityTier = 1 | 2 | 3;
export type CraftingContext = {
  sceneId: string;
};

export type CraftingRecipe = {
  id: string;
  name: string;
  category: string;
  tier: ItemTier;
  description: string;
  source?: string;
  ingredients: Record<string, number>;
  resultItem: string;
  quantity: number;
  requiresSkills?: Record<string, number>;
  requiresTools?: string[];
  requiredFacility?: CraftingFacility;
  requiredFacilityTier?: CraftingFacilityTier;
};

export type CraftResult = {
  gameState: GameState;
  message: string;
  skillBreakthrough?: CraftingSkillBreakthroughResult;
};

export type CraftingBottleneckAttempt = {
  skillIds: string[];
  skillNames: string[];
  tree: SkillTree | "Crafting";
  chance: number;
  failures: number;
};

export type CraftingSkillBreakthroughResult = CraftingBottleneckAttempt & {
  success: boolean;
  nextChance: number;
  nextRanks: Record<string, number>;
};

const skillData = skills as Skill[];

export function canCraftRecipe(
  player: Player,
  recipe: CraftingRecipe,
  context?: CraftingContext,
): boolean {
  return (
    hasIngredients(player.inventory, recipe.ingredients) &&
    hasSkillRanks(player.skills, recipe.requiresSkills) &&
    hasRequiredTools(player.inventory, recipe.requiresTools) &&
    hasRequiredFacility(player, recipe.requiredFacility, recipe.requiredFacilityTier, context)
  );
}

export function craftRecipe(
  gameState: GameState,
  recipe: CraftingRecipe,
  context?: CraftingContext,
): CraftResult {
  if (!hasIngredients(gameState.player.inventory, recipe.ingredients)) {
    return {
      gameState,
      message: "Missing ingredients.",
    };
  }

  if (!hasSkillRanks(gameState.player.skills, recipe.requiresSkills)) {
    return {
      gameState,
      message: "Required crafting skill is too low.",
    };
  }

  if (!hasRequiredTools(gameState.player.inventory, recipe.requiresTools)) {
    return {
      gameState,
      message: "Required crafting tool is missing.",
    };
  }

  if (!hasRequiredFacility(
    gameState.player,
    recipe.requiredFacility,
    recipe.requiredFacilityTier,
    context,
  )) {
    return {
      gameState,
      message: "Required crafting facility is unavailable.",
    };
  }

  const craftedItems = Array.from({ length: recipe.quantity }, () => recipe.resultItem);

  return {
    gameState: {
      ...gameState,
      player: {
        ...gameState.player,
        inventory: [
          ...removeIngredients(gameState.player.inventory, recipe.ingredients),
          ...craftedItems,
        ],
      },
    },
    message: `Crafted ${recipe.name}.`,
  };
}

export function getCraftingBottleneckAttempt(
  player: Player,
  recipe: CraftingRecipe,
  context?: CraftingContext,
): CraftingBottleneckAttempt | null {
  if (
    hasSkillRanks(player.skills, recipe.requiresSkills) ||
    !hasIngredients(player.inventory, recipe.ingredients) ||
    !hasRequiredTools(player.inventory, recipe.requiresTools) ||
    !hasRequiredFacility(player, recipe.requiredFacility, recipe.requiredFacilityTier, context)
  ) {
    return null;
  }

  const bottleneckSkillIds: string[] = [];

  for (const [skillId, requiredRank] of Object.entries(recipe.requiresSkills ?? {})) {
    const skill = getSkill(skillId);
    const currentRank = player.skills[skillId] ?? 0;

    if (currentRank >= requiredRank) {
      continue;
    }

    if (
      !skill ||
      currentRank <= 0 ||
      requiredRank !== currentRank + 1 ||
      !isSkillAtBottleneck(
        currentRank,
        skill.maxRank,
        player.skillPractice[skillId] ?? 0,
      )
    ) {
      return null;
    }

    bottleneckSkillIds.push(skillId);
  }

  if (bottleneckSkillIds.length <= 0) {
    return null;
  }

  const failures = getBottleneckFailureCount(player, bottleneckSkillIds);
  const primarySkill = getSkill(bottleneckSkillIds[0]);

  return {
    skillIds: bottleneckSkillIds,
    skillNames: bottleneckSkillIds.map(
      (skillId) => getSkill(skillId)?.name ?? skillId,
    ),
    tree: primarySkill?.tree ?? getFallbackRecipeTree(recipe),
    chance: getSkillBottleneckSuccessChance(failures),
    failures,
  };
}

export function attemptCraftingBottleneck(
  gameState: GameState,
  recipe: CraftingRecipe,
  context?: CraftingContext,
): CraftResult {
  const attempt = getCraftingBottleneckAttempt(gameState.player, recipe, context);

  if (!attempt) {
    return {
      gameState,
      message: "This recipe is not ready for a bottleneck attempt.",
    };
  }

  const success = Math.random() * 100 < attempt.chance;
  const nextRanks: Record<string, number> = {};

  if (success) {
    const craftedItems = Array.from(
      { length: recipe.quantity },
      () => recipe.resultItem,
    );
    const nextSkills = { ...gameState.player.skills };
    const nextPractice = { ...gameState.player.skillPractice };
    const nextFailures = { ...gameState.player.skillBottleneckFailures };

    attempt.skillIds.forEach((skillId) => {
      const skill = getSkill(skillId);
      const nextRank = Math.min(
        skill?.maxRank ?? 4,
        (gameState.player.skills[skillId] ?? 0) + 1,
      );

      nextSkills[skillId] = nextRank;
      nextPractice[skillId] = 0;
      nextFailures[skillId] = 0;
      nextRanks[skillId] = nextRank;
    });

    return {
      gameState: {
        ...gameState,
        player: {
          ...gameState.player,
          inventory: [
            ...removeIngredients(gameState.player.inventory, recipe.ingredients),
            ...craftedItems,
          ],
          skills: nextSkills,
          skillPractice: nextPractice,
          skillBottleneckFailures: nextFailures,
        },
      },
      message: `Breakthrough craft succeeded: ${recipe.name}.`,
      skillBreakthrough: {
        ...attempt,
        success: true,
        nextChance: getSkillBottleneckSuccessChance(0),
        nextRanks,
      },
    };
  }

  const nextFailures = { ...gameState.player.skillBottleneckFailures };

  attempt.skillIds.forEach((skillId) => {
    nextFailures[skillId] = (nextFailures[skillId] ?? 0) + 1;
    nextRanks[skillId] = gameState.player.skills[skillId] ?? 0;
  });

  const nextFailureCount = getBottleneckFailureCount(
    { ...gameState.player, skillBottleneckFailures: nextFailures },
    attempt.skillIds,
  );

  return {
    gameState: {
      ...gameState,
      player: {
        ...gameState.player,
        skillBottleneckFailures: nextFailures,
      },
    },
    message: `Breakthrough craft failed: ${recipe.name}. The materials survived, and the next attempt will be easier.`,
    skillBreakthrough: {
      ...attempt,
      success: false,
      nextChance: getSkillBottleneckSuccessChance(nextFailureCount),
      nextRanks,
    },
  };
}

export function getInventoryCounts(inventory: string[]): Record<string, number> {
  return inventory.reduce<Record<string, number>>(
    (counts, itemId) => ({
      ...counts,
      [itemId]: (counts[itemId] ?? 0) + 1,
    }),
    {},
  );
}

export function getCraftingFacilityLabel(facility: CraftingFacility): string {
  const labels: Record<CraftingFacility, string> = {
    field_kit: "Field Kit",
    alchemy_room: "Alchemy Room",
    blacksmithing_room: "Forge",
  };

  return labels[facility];
}

export function getCraftingFacilityRequirementLabel(
  facility: CraftingFacility,
  tier: CraftingFacilityTier = 1,
): string {
  return `${getCraftingFacilityLabel(facility)} ${formatFacilityTier(tier)}`;
}

export function getCraftingFacilityTier(
  player: Player,
  facility: CraftingFacility,
): 0 | CraftingFacilityTier {
  if (facility === "field_kit") {
    if (!player.inventory.includes("mortal_repair_bundle")) {
      return 0;
    }

    if (
      player.flags.room_upgrade_tool_rack ||
      player.flags.learned_craft_hall_field_reinforcement ||
      (player.skills.campcraft ?? 0) >= 3
    ) {
      return 2;
    }

    return 1;
  }

  if (facility === "alchemy_room") {
    if (
      player.flags.medicine_hall_free_alchemy_access ||
      player.flags.room_upgrade_alchemy_workbench ||
      player.flags.learned_medicine_hall_residue_control ||
      player.flags.passed_medicine_hall_basic_test ||
      player.flags.learned_foundation_steadying_decoction ||
      (player.reputation.medicine_hall ?? 0) >= 8
    ) {
      return 2;
    }

    if (
      player.flags.medicine_hall_alchemy_access ||
      player.flags.learned_medicine_hall_basic_prep ||
      player.flags.learned_medicine_hall_stable_ratios ||
      (player.reputation.medicine_hall ?? 0) >= 4
    ) {
      return 1;
    }

    return 0;
  }

  if (
    player.flags.craft_hall_free_forge_access ||
    player.flags.learned_luo_beast_patterns ||
    player.flags.learned_luo_staff_patterns ||
    player.flags.learned_craft_hall_spirit_material_handling ||
    player.flags.passed_craft_hall_basic_test ||
    (player.reputation.craft_hall ?? 0) >= 8
  ) {
    return 2;
  }

  if (
    player.flags.helped_luo_sort_salvage ||
    player.flags.learned_luo_basic_patterns ||
    player.flags.craft_hall_forge_access ||
    player.flags.learned_craft_hall_forge_safety ||
    player.flags.learned_craft_hall_field_reinforcement ||
    (player.reputation.craft_hall ?? 0) >= 4
  ) {
    return 1;
  }

  return 0;
}

export function getCraftingFacilityUnlockHint(
  facility: CraftingFacility,
  tier: CraftingFacilityTier = 1,
): string {
  if (facility === "field_kit") {
    return tier >= 2
      ? "Upgrade your room tool rack, learn Craft Hall field reinforcement, or reach Campcraft rank 3."
      : "Carry a Mortal Repair Bundle.";
  }

  if (facility === "alchemy_room") {
    return tier >= 2
      ? "Earn Medicine Hall reputation 8, build an alchemy workbench, pass Lan Ruxue's test, or receive Elder Shen's guidance."
      : "Earn Medicine Hall reputation 4, rent a supervised bench, or learn basic Medicine Hall preparation.";
  }

  return tier >= 2
    ? "Earn Craft Hall reputation 8, gain free forge access, pass Han's test, or learn spirit-material handling."
    : "Help Luo Jiwei, earn Craft Hall reputation 4, rent forge access, or learn forge safety.";
}

export function hasRequiredFacility(
  player: Player,
  facility?: CraftingFacility,
  tier: CraftingFacilityTier = 1,
  context?: CraftingContext,
): boolean {
  if (!facility) {
    return true;
  }

  return (
    getCraftingFacilityTier(player, facility) >= tier &&
    hasCraftingFacilityLocation(player, facility, context)
  );
}

export function hasCraftingFacilityLocation(
  player: Player,
  facility?: CraftingFacility,
  context?: CraftingContext,
): boolean {
  if (!facility || facility === "field_kit" || !context) {
    return true;
  }

  if (facility === "alchemy_room") {
    return (
      context.sceneId === "medicine_hall_alchemy_room" ||
      context.sceneId === "medicine_hall_paid_bench" ||
      context.sceneId === "medicine_hall_free_bench" ||
      context.sceneId === "room_alchemy_workbench" ||
      (context.sceneId === "room_hub" && player.flags.room_upgrade_alchemy_workbench === true)
    );
  }

  return (
    context.sceneId === "craft_hall_forge" ||
    context.sceneId === "craft_hall_paid_forge" ||
    context.sceneId === "craft_hall_free_forge" ||
    context.sceneId === "town_blacksmith_shop" ||
    context.sceneId === "village_forge_yard"
  );
}

export function getCraftingFacilityLocationHint(facility: CraftingFacility): string {
  if (facility === "field_kit") {
    return "Carry a Mortal Repair Bundle.";
  }

  if (facility === "alchemy_room") {
    return "Use the Medicine Hall alchemy room or your personal alchemy workbench.";
  }

  return "Use the Craft Hall forge, a rented forge bench, or a blacksmith's forge.";
}

function formatFacilityTier(tier: CraftingFacilityTier): string {
  const labels: Record<CraftingFacilityTier, string> = {
    1: "I",
    2: "II",
    3: "III",
  };

  return labels[tier];
}

function hasIngredients(
  inventory: string[],
  ingredients: CraftingRecipe["ingredients"],
): boolean {
  const counts = getInventoryCounts(inventory);

  return Object.entries(ingredients).every(
    ([itemId, requiredCount]) => (counts[itemId] ?? 0) >= requiredCount,
  );
}

function hasSkillRanks(
  skills: Player["skills"],
  requiredSkills: CraftingRecipe["requiresSkills"] = {},
): boolean {
  return Object.entries(requiredSkills).every(
    ([skillId, requiredRank]) => (skills[skillId] ?? 0) >= requiredRank,
  );
}

function hasRequiredTools(
  inventory: string[],
  requiredTools: CraftingRecipe["requiresTools"] = [],
): boolean {
  return requiredTools.every((itemId) => inventory.includes(itemId));
}

function getSkill(skillId: string): Skill | undefined {
  return skillData.find((candidate) => candidate.id === skillId);
}

function getBottleneckFailureCount(player: Player, skillIds: string[]): number {
  return Math.max(
    0,
    ...skillIds.map((skillId) => player.skillBottleneckFailures[skillId] ?? 0),
  );
}

function getFallbackRecipeTree(recipe: CraftingRecipe): SkillTree | "Crafting" {
  if (recipe.category === "Elixir" || recipe.category === "Medicine") {
    return "Alchemy";
  }

  if (recipe.category === "Weapon" || recipe.category === "Armor") {
    return "Blacksmithing";
  }

  return "Crafting";
}

function removeIngredients(
  inventory: string[],
  ingredients: CraftingRecipe["ingredients"],
): string[] {
  const remainingIngredients = { ...ingredients };

  return inventory.filter((itemId) => {
    if (!remainingIngredients[itemId]) {
      return true;
    }

    remainingIngredients[itemId] -= 1;
    return false;
  });
}
