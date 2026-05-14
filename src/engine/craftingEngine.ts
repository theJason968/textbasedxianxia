import type { GameState, ItemTier, Player } from "./types";

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
};

export type CraftResult = {
  gameState: GameState;
  message: string;
};

export function canCraftRecipe(player: Player, recipe: CraftingRecipe): boolean {
  return (
    hasIngredients(player.inventory, recipe.ingredients) &&
    hasSkillRanks(player.skills, recipe.requiresSkills)
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
