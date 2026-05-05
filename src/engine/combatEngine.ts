import type {
  CombatNarration,
  CombatState,
  Enemy,
  EquipmentSlot,
  GameState,
  Player,
  Scene,
} from "./types";
import { getSkillEffectTotals } from "./skillEngine";
import scenes from "../data/scenes.json";
import items from "../data/items.json";
import type { EquipmentEffects } from "./types";

export type CombatAction = "strike" | "weapon" | "focus" | "flee";
const sceneData = scenes as Scene[];
const itemData = items as Array<{
  id: string;
  name: string;
  equipmentSlot?: EquipmentSlot;
  equipmentEffects?: EquipmentEffects;
}>;
const defaultCombatNarration: Required<CombatNarration> = {
  opening: ["{enemy} blocks the path."],
  strike: ["You strike {enemy} for {damage} damage."],
  focus: [
    "You draw qi through your meridians and drive it into the blow, striking {enemy} for {damage} damage.",
  ],
  enemyAttack: ["{enemy} counters for {damage} damage."],
  victory: ["{enemy} falls beneath your final strike."],
  defeat: ["Your guard breaks, and {enemy} drives you back."],
};

export function startCombat(
  gameState: GameState,
  enemy: Enemy,
  victorySceneId: string,
  defeatSceneId: string,
): GameState {
  const narration = getCombatNarration(gameState.currentSceneId);

  return {
    ...gameState,
    combat: {
      enemyId: enemy.id,
      enemyHealth: enemy.maxHealth,
      turn: 1,
      victorySceneId,
      defeatSceneId,
      log: [renderCombatLine(pickCombatLine(narration.opening, 0), enemy, 0)],
    },
  };
}

export function resolveCombatAction(
  gameState: GameState,
  enemy: Enemy,
  action: CombatAction,
): GameState {
  if (!gameState.combat) {
    return gameState;
  }

  if (action === "flee") {
    return {
      ...gameState,
      combat: null,
      currentSceneId: gameState.combat.defeatSceneId,
    };
  }

  if (action === "focus" && !canFocusQiInCombat(gameState.player)) {
    return gameState;
  }

  if (action === "weapon" && !gameState.player.equipment.weapon) {
    return gameState;
  }

  const playerDamage = getPlayerDamage(gameState.player, action);
  const enemyHealth = Math.max(0, gameState.combat.enemyHealth - playerDamage);
  const narration = getCombatNarration(gameState.currentSceneId);
  const actionLog = renderCombatLine(
    getPlayerActionLine(gameState.player, action, narration, gameState.combat.turn),
    enemy,
    playerDamage,
  );

  if (enemyHealth <= 0) {
    return finishCombat(gameState, enemy);
  }

  const enemyDamage = getEnemyDamage(gameState.player, enemy);
  const playerHealth = Math.max(0, gameState.player.health - enemyDamage);
  const enemyLog = renderCombatLine(
    pickCombatLine(narration.enemyAttack, gameState.combat.turn - 1),
    enemy,
    enemyDamage,
  );

  if (playerHealth <= 0) {
    return {
      ...gameState,
      currentSceneId: gameState.combat.defeatSceneId,
      combat: null,
      player: {
        ...gameState.player,
        health: 0,
      },
    };
  }

  return {
    ...gameState,
    player: {
      ...gameState.player,
      health: playerHealth,
      qi:
        action === "focus"
          ? Math.max(0, gameState.player.qi - 2)
          : gameState.player.qi,
    },
    combat: {
      ...gameState.combat,
      enemyHealth,
      turn: gameState.combat.turn + 1,
      log: [actionLog, enemyLog, ...gameState.combat.log].slice(0, 6),
    },
  };
}

function finishCombat(gameState: GameState, enemy: Enemy): GameState {
  const combat = gameState.combat as CombatState;
  const rewardedQi = Math.min(gameState.player.maxQi, gameState.player.qi + enemy.qiReward);

  return {
    ...gameState,
    currentSceneId: combat.victorySceneId,
    combat: null,
    player: {
      ...gameState.player,
      qi: rewardedQi,
      inventory: [...new Set([...gameState.player.inventory, ...(enemy.itemRewards ?? [])])],
      flags: {
        ...gameState.player.flags,
        [`defeated_${enemy.id}`]: true,
      },
    },
  };
}

function getPlayerDamage(player: Player, action: CombatAction): number {
  const techniqueBonus = player.techniques.includes("azure_cloud_breathing") ? 2 : 0;
  const focusBonus = action === "focus" && player.qi >= 2 ? 4 : 0;
  const skillBonus = getSkillEffectTotals(player).combatDamage;
  const attributeBonus =
    action === "weapon"
      ? Math.floor((player.strength + player.agility) / 3)
      : Math.floor(player.strength / 2);
  const equipmentBonus =
    action === "weapon" || action === "focus"
      ? getEquipmentEffectTotals(player).combatDamage
      : 0;

  return Math.max(
    1,
    3 +
      player.physique +
      attributeBonus +
      techniqueBonus +
      focusBonus +
      skillBonus +
      equipmentBonus,
  );
}

function canFocusQiInCombat(player: Player): boolean {
  return player.realm !== "Mortal" || player.stage !== "Early";
}

function getPlayerActionLine(
  player: Player,
  action: CombatAction,
  narration: Required<CombatNarration>,
  turn: number,
): string {
  if (action === "focus") {
    return pickCombatLine(narration.focus, turn - 1);
  }

  if (action === "weapon") {
    const weaponName = getEquippedWeaponName(player) ?? "your weapon";

    return `You strike with ${weaponName}, hitting {enemy} for {damage} damage.`;
  }

  return pickCombatLine(narration.strike, turn - 1);
}

function getEquippedWeaponName(player: Player): string | null {
  const weaponId = player.equipment.weapon;

  return itemData.find((candidate) => candidate.id === weaponId)?.name ?? null;
}

function getEnemyDamage(player: Player, enemy: Enemy): number {
  const skillDefense = getSkillEffectTotals(player).combatDefense;
  const equipmentDefense = getEquipmentEffectTotals(player).combatDefense;
  const attributeDefense = Math.floor((player.endurance + player.agility) / 4);

  return Math.max(
    1,
    enemy.attack -
      Math.floor(player.physique / 2) -
      attributeDefense -
      skillDefense -
      equipmentDefense,
  );
}

function getEquipmentEffectTotals(player: Player): Required<EquipmentEffects> {
  return Object.values(player.equipment).reduce<Required<EquipmentEffects>>(
    (totals, itemId) => {
      const item = itemData.find((candidate) => candidate.id === itemId);

      return {
        combatDamage: totals.combatDamage + (item?.equipmentEffects?.combatDamage ?? 0),
        combatDefense:
          totals.combatDefense + (item?.equipmentEffects?.combatDefense ?? 0),
        maxHealth: totals.maxHealth + (item?.equipmentEffects?.maxHealth ?? 0),
        maxQi: totals.maxQi + (item?.equipmentEffects?.maxQi ?? 0),
      };
    },
    {
      combatDamage: 0,
      combatDefense: 0,
      maxHealth: 0,
      maxQi: 0,
    },
  );
}

function getCombatNarration(sceneId: string): Required<CombatNarration> {
  const scene = sceneData.find((candidate) => candidate.id === sceneId);

  return {
    opening: scene?.combatNarration?.opening ?? defaultCombatNarration.opening,
    strike: scene?.combatNarration?.strike ?? defaultCombatNarration.strike,
    focus: scene?.combatNarration?.focus ?? defaultCombatNarration.focus,
    enemyAttack:
      scene?.combatNarration?.enemyAttack ?? defaultCombatNarration.enemyAttack,
    victory: scene?.combatNarration?.victory ?? defaultCombatNarration.victory,
    defeat: scene?.combatNarration?.defeat ?? defaultCombatNarration.defeat,
  };
}

function pickCombatLine(lines: string[], turnIndex: number): string {
  return lines[turnIndex % lines.length] ?? "";
}

function renderCombatLine(template: string, enemy: Enemy, damage: number): string {
  return template
    .replaceAll("{enemy}", enemy.name)
    .replaceAll("{damage}", String(damage));
}
