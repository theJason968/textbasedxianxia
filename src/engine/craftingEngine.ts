import type { GameState, ItemTier, Player } from "./types";

export type CraftingFacility = "field_kit" | "alchemy_room" | "blacksmithing_room";
export type CraftingFacilityTier = 1 | 2 | 3;

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
};

export function canCraftRecipe(player: Player, recipe: CraftingRecipe): boolean {
  return (
    hasIngredients(player.inventory, recipe.ingredients) &&
    hasSkillRanks(player.skills, recipe.requiresSkills) &&
    hasRequiredTools(player.inventory, recipe.requiresTools) &&
    hasRequiredFacility(player, recipe.requiredFacility, recipe.requiredFacilityTier)
  );
}

export function craftRecipe(
  gameState: GameState,
  recipe: CraftingRecipe,
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
): boolean {
  if (!facility) {
    return true;
  }

  return getCraftingFacilityTier(player, facility) >= tier;
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
