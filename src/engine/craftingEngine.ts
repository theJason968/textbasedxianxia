import type { GameState, ItemTier, Player } from "./types";

export type CraftingFacility = "field_kit" | "alchemy_room" | "blacksmithing_room";

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
    hasRequiredFacility(player, recipe.requiredFacility)
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

  if (!hasRequiredFacility(gameState.player, recipe.requiredFacility)) {
    return {
      gameState,
      message: "Required crafting room is unavailable.",
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
    field_kit: "Mortal Repair Bundle",
    alchemy_room: "Alchemy room",
    blacksmithing_room: "Blacksmithing room",
  };

  return labels[facility];
}

export function hasRequiredFacility(
  player: Player,
  facility?: CraftingFacility,
): boolean {
  if (!facility) {
    return true;
  }

  if (facility === "field_kit") {
    return player.inventory.includes("mortal_repair_bundle");
  }

  if (facility === "alchemy_room") {
    return Boolean(player.flags.room_upgrade_alchemy_workbench);
  }

  return Boolean(
    player.flags.helped_luo_sort_salvage ||
      player.flags.learned_luo_basic_patterns ||
      player.flags.learned_luo_beast_patterns ||
      player.flags.learned_luo_staff_patterns ||
      player.flags.craft_hall_forge_access ||
      player.flags.craft_hall_free_forge_access ||
      (player.reputation.craft_hall ?? 0) >= 8,
  );
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
