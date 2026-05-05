import type { EquipmentEffects, EquipmentSlot, GameState, Player } from "./types";

type UsableItem = {
  id: string;
  name: string;
  equipmentSlot?: EquipmentSlot;
  equipmentEffects?: EquipmentEffects;
  effects: Partial<
    Pick<
      Player,
      | "health"
      | "qi"
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
    >
  >;
};

type ItemUseResult = {
  gameState: GameState;
  message: string;
};

const effectKeys: Array<keyof UsableItem["effects"]> = [
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
  "spiritStones",
];

export function useItem(gameState: GameState, item: UsableItem): ItemUseResult {
  if (!gameState.player.inventory.includes(item.id)) {
    return {
      gameState,
      message: `${item.name} is not in your inventory.`,
    };
  }

  if (Object.keys(item.effects).length === 0) {
    return {
      gameState,
      message: `${item.name} has no immediate use.`,
    };
  }

  const nextPlayer = effectKeys.reduce<Player>(
    (player, key) => {
      const change = item.effects[key];

      if (typeof change !== "number") {
        return player;
      }

      return {
        ...player,
        [key]: clampPlayerStat(player, key, player[key] + change),
      };
    },
    {
      ...gameState.player,
      inventory: removeOne(gameState.player.inventory, item.id),
    },
  );

  return {
    gameState: {
      ...gameState,
      player: nextPlayer,
    },
    message: `Used ${item.name}.`,
  };
}

export function equipItem(gameState: GameState, item: UsableItem): ItemUseResult {
  if (!gameState.player.inventory.includes(item.id)) {
    return {
      gameState,
      message: `${item.name} is not in your inventory.`,
    };
  }

  if (!item.equipmentSlot) {
    return {
      gameState,
      message: `${item.name} cannot be equipped.`,
    };
  }

  return {
    gameState: {
      ...gameState,
      player: {
        ...gameState.player,
        equipment: {
          ...gameState.player.equipment,
          [item.equipmentSlot]: item.id,
        },
      },
    },
    message: `Equipped ${item.name}.`,
  };
}

export function unequipItem(
  gameState: GameState,
  slot: EquipmentSlot,
): ItemUseResult {
  const equippedItemId = gameState.player.equipment[slot];

  if (!equippedItemId) {
    return {
      gameState,
      message: `Nothing is equipped in ${slot}.`,
    };
  }

  const nextEquipment = { ...gameState.player.equipment };
  delete nextEquipment[slot];

  return {
    gameState: {
      ...gameState,
      player: {
        ...gameState.player,
        equipment: nextEquipment,
      },
    },
    message: `Unequipped ${equippedItemId}.`,
  };
}

function removeOne(items: string[], itemId: string): string[] {
  const index = items.indexOf(itemId);

  if (index === -1) {
    return items;
  }

  return [...items.slice(0, index), ...items.slice(index + 1)];
}

function clampPlayerStat(
  player: Player,
  key: keyof UsableItem["effects"],
  value: number,
): number {
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

  return lowerBoundedValue;
}
