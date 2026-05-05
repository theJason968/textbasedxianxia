import type {
  CombatNarration,
  CombatState,
  Enemy,
  GameState,
  Player,
  Scene,
} from "./types";
import { getSkillEffectTotals } from "./skillEngine";
import scenes from "../data/scenes.json";

export type CombatAction = "strike" | "focus" | "flee";
const sceneData = scenes as Scene[];
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

  const playerDamage = getPlayerDamage(gameState.player, action);
  const enemyHealth = Math.max(0, gameState.combat.enemyHealth - playerDamage);
  const narration = getCombatNarration(gameState.currentSceneId);
  const actionLines = action === "focus" ? narration.focus : narration.strike;
  const actionLog = renderCombatLine(
    pickCombatLine(actionLines, gameState.combat.turn - 1),
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
      qi: action === "focus" ? Math.max(0, gameState.player.qi - 2) : gameState.player.qi,
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

  return Math.max(1, 3 + player.physique + techniqueBonus + focusBonus + skillBonus);
}

function getEnemyDamage(player: Player, enemy: Enemy): number {
  const skillDefense = getSkillEffectTotals(player).combatDefense;

  return Math.max(1, enemy.attack - Math.floor(player.physique / 2) - skillDefense);
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
