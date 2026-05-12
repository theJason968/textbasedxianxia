import type {
  CombatNarration,
  CombatPowerTier,
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

export type CombatAction = "strike" | "weapon" | "focus" | "technique" | "flee";

type TechniqueMasteryTier = "novice" | "practiced" | "mastered";

type TechniqueCombatData = {
  strike: Record<TechniqueMasteryTier, string[]>;
  damageBonusPerTier: Record<TechniqueMasteryTier, number>;
  qiCost: number;
  defenseBonus?: number;
};

// Per-technique combat narration and damage scaling by mastery tier
const techniqueCombatData: Record<string, TechniqueCombatData> = {
  azure_cloud_breathing: {
    qiCost: 3,
    damageBonusPerTier: { novice: 2, practiced: 5, mastered: 9 },
    strike: {
      novice: [
        "You push a thin thread of qi through the strike. It lands on {enemy} for {damage} damage — more than a bare blow, but the qi disperses before it fully channels.",
        "The Azure Cloud Breathing feeds something into the motion. {enemy} takes {damage} damage. The technique is there, but rough.",
      ],
      practiced: [
        "Cloud qi tightens along your forearm before the blow connects. {enemy} takes {damage} damage — the technique is holding its shape now.",
        "The breathing cycle stays intact through the strike. {enemy} receives {damage} damage and you feel the cloud qi release cleanly.",
      ],
      mastered: [
        "Cloud qi condenses along your forearm before you release. The full force of the Azure Cloud Method lands on {enemy} for {damage} damage. The technique moves like it belongs in the body.",
        "The breath count stays unbroken through the strike. {enemy} takes {damage} damage — cloud qi and momentum arriving at the same moment.",
      ],
    },
  },
  pine_shadow_step: {
    qiCost: 2,
    damageBonusPerTier: { novice: 1, practiced: 3, mastered: 6 },
    strike: {
      novice: [
        "You shift your footing and attack from a different angle, catching {enemy} off-guard for {damage} damage. The step is rough but the angle is right.",
        "Pine Shadow Step carries you past {enemy}'s guard. {damage} damage. The footwork is still finding where it wants to go.",
      ],
      practiced: [
        "You move through {enemy}'s guard like wind between pines — {damage} damage from an angle it was not defending. The step is cleaner now.",
        "The footwork reads {enemy}'s weight before you move. {damage} damage from the blind side. The technique is earning its name.",
      ],
      mastered: [
        "You are already past {enemy} before it registers the movement. {damage} damage from behind the guard — the strike arrives from shadow, and the shadow moved first.",
        "Pine Shadow Step dissolves the distance between you and {enemy}'s weakness. {damage} damage. There is no visible gap between stillness and the blow landing.",
      ],
    },
  },
  iron_body_method: {
    qiCost: 3,
    defenseBonus: 4,
    damageBonusPerTier: { novice: 0, practiced: 2, mastered: 5 },
    strike: {
      novice: [
        "You settle into the Iron Body stance and push qi into your skin before {enemy} connects. The impact lands for {damage} damage — less than it should have been.",
        "You harden the qi layer around your core as {enemy} closes in. {damage} damage. The method is rough but the principle is working.",
      ],
      practiced: [
        "Your skin tightens with condensed qi as {enemy}'s strike arrives. You absorb it and answer immediately — {damage} damage in the counter.",
        "The Iron Body stance holds. You move through {enemy}'s blow rather than away from it. {damage} damage in return, struck from inside the impact.",
      ],
      mastered: [
        "You step into {enemy}'s force. The Iron Body qi distributes the impact across your entire frame and returns it. {damage} damage — delivered with the absorbed momentum.",
        "Your body is the method now. You take {enemy}'s blow as an offering and answer with {damage} damage through the same channel.",
      ],
    },
  },
  wind_blade_strike: {
    qiCost: 2,
    damageBonusPerTier: { novice: 3, practiced: 6, mastered: 10 },
    strike: {
      novice: [
        "You pull wind qi along your arm and release it in a cutting arc at {enemy} for {damage} damage. The edge is inconsistent, but the qi is there.",
        "Wind qi forms a blade shape and you direct it. {enemy} takes {damage} damage. You can feel the shape wanting to sharpen further.",
      ],
      practiced: [
        "The wind qi condenses cleanly along your strike. {enemy} takes {damage} damage — the blade holds its edge through impact now.",
        "You read the air pressure and cut with it rather than through it. {enemy} receives {damage} damage. The technique has stopped fighting itself.",
      ],
      mastered: [
        "The wind blade is invisible before it arrives. {enemy} takes {damage} damage from an edge it could not track. Wind qi does not announce its direction.",
        "You release at the moment of stillness between breaths. {enemy} takes {damage} damage — the cut carries the pressure of the mountain air behind it.",
      ],
    },
  },
  void_step: {
    qiCost: 4,
    damageBonusPerTier: { novice: 4, practiced: 8, mastered: 13 },
    strike: {
      novice: [
        "You read the gap in {enemy}'s awareness and step through it. {damage} damage from an angle it was not watching. Cruder than it will become.",
        "Void Step carries you past {enemy}'s guard before it finishes committing. {damage} damage. The distance closed differently than it expected.",
      ],
      practiced: [
        "You enter the space between {enemy}'s focus and its reach. {damage} damage — it did not know you had moved until the strike was already landing.",
        "The step reads the opponent's intention before the body follows it. {enemy} takes {damage} damage from the direction of the shadow, not the cultivator.",
      ],
      mastered: [
        "You are not there when {enemy} moves to intercept. You are somewhere else entirely, and then you are back, and {damage} damage has already happened.",
        "Void Step at full expression: no gap between intent and arrival. {enemy} takes {damage} damage from a position that briefly did not exist.",
      ],
    },
  },
  thunder_current_strike: {
    qiCost: 3,
    damageBonusPerTier: { novice: 4, practiced: 7, mastered: 11 },
    strike: {
      novice: [
        "You release the lightning qi before you have full control of it. {enemy} takes {damage} damage — the discharge runs briefly back up your arm. The technique needs refinement.",
        "A rough lightning strike catches {enemy} for {damage} damage. The current is there. The direction is not yet.",
      ],
      practiced: [
        "The lightning qi concentrates cleanly and discharges into {enemy} for {damage} damage. The method is starting to answer your direction.",
        "You read the ambient charge and direct it at {enemy}. {damage} damage — the strike arrives faster than a physical blow could.",
      ],
      mastered: [
        "The discharge is nearly invisible before impact. {enemy} takes {damage} damage before the motion registers as a strike. Lightning qi does not announce itself.",
        "You concentrate the current to a single point and release it into {enemy}'s guard. {damage} damage — precision arriving before the target can respond.",
      ],
    },
  },
};

const sceneData = scenes as Scene[];
const itemData = items as Array<{
  id: string;
  name: string;
  equipmentSlot?: EquipmentSlot;
  equipmentEffects?: EquipmentEffects;
}>;

// Tiered narration pools — used when a scene has no custom combatNarration
const tieredNarration: Record<CombatPowerTier, Required<CombatNarration>> = {
  dominant: {
    opening: [
      "{enemy} moves to block the path. It has not yet understood what it is facing.",
      "You register {enemy} as an obstacle. The registration does not take long.",
    ],
    strike: [
      "The blow lands before {enemy} finishes its stance. {damage} damage — it barely registered the threat.",
      "You move through {enemy}'s guard without resistance. {damage} damage.",
      "{enemy} swings wide. You step past it and answer with {damage} damage before it can reset.",
      "A clean strike. {damage} damage. {enemy} staggers from something it did not see coming fast enough.",
    ],
    focus: [
      "Qi moves through the strike like something that has learned where to go. {enemy} receives {damage} damage and cannot answer.",
      "The focused blow carries more intent than {enemy} can handle. {damage} damage, and the creature's footing breaks.",
    ],
    enemyAttack: [
      "{enemy} manages a counter. {damage} damage — you have felt harder blows in morning training.",
      "The creature finds an angle. {damage} damage. You adjust your footing without giving ground.",
      "{enemy} lands something. {damage} damage. You close the gap it tried to create.",
    ],
    victory: [
      "{enemy} drops before the fight has time to feel like one.",
      "You step back. {enemy} does not rise. This was not a contest.",
      "The final blow lands. {enemy} goes down clean. You are barely breathing harder than before.",
    ],
    defeat: [
      "Even against a weaker opponent, you let your guard fall. {enemy} drives you back.",
    ],
  },
  contested: {
    opening: [
      "{enemy} stands ready. You are not certain this will be clean.",
      "The distance between you and {enemy} closes. This one is a real fight.",
    ],
    strike: [
      "You land a solid blow on {enemy} for {damage} damage. It absorbs more than you hoped.",
      "The strike connects — {damage} damage — but {enemy} turns with it and gives you less than you wanted.",
      "{enemy}'s defense holds better than expected. You work through it for {damage} damage.",
      "A good exchange. {damage} damage landed. Neither of you has found the decisive edge yet.",
    ],
    focus: [
      "You push qi into the strike. {enemy} takes {damage} damage and you reclaim the space it was holding.",
      "Focused qi drives through the guard. {damage} damage. {enemy} feels it but does not break.",
    ],
    enemyAttack: [
      "{enemy} finds a gap in your guard. {damage} damage — you feel it settle.",
      "The counter comes faster than expected. {damage} damage. You reset your stance.",
      "{enemy} hits with more force than the approach suggested. {damage} damage. Stay sharp.",
    ],
    victory: [
      "{enemy} goes down. You allow yourself one breath before checking what it cost you.",
      "The final blow lands and {enemy} does not rise. You are still standing. That is enough.",
      "{enemy} falls. You ran the fight well. It was closer than the gap in your strength should have allowed.",
    ],
    defeat: [
      "The fight turns against you. {enemy} pushes through your defense and drives you back.",
    ],
  },
  struggling: {
    opening: [
      "{enemy} moves with a confidence that tells you this will not be simple.",
      "You face {enemy} and understand immediately that strength alone will not settle this.",
    ],
    strike: [
      "You force the blow through and manage {damage} damage. {enemy} absorbs it without slowing.",
      "The strike lands for {damage} damage. Not enough. You already know it is not enough.",
      "{enemy} is harder than you are right now. You land {damage} damage and look for a way to make it matter.",
      "You find an opening for {damage} damage. Smaller than you needed. Keep moving.",
    ],
    focus: [
      "Every thread of qi you have goes into the strike. {enemy} takes {damage} damage. You are running empty now.",
      "You pour focus into the blow — {damage} damage — and feel the cost immediately. {enemy} is still upright.",
    ],
    enemyAttack: [
      "{enemy} hits before you complete the motion. {damage} damage. You taste iron.",
      "The blow comes fast and lands hard. {damage} damage — your guard was nowhere near ready.",
      "{enemy} drives through your defense like it was not there. {damage} damage. This is what outmatched feels like.",
    ],
    victory: [
      "{enemy} finally goes down. You are not certain how much of it was skill.",
      "It is over. You are still standing — which is the relevant fact right now.",
      "The creature drops. You fought past where your strength ran out and found something else.",
    ],
    defeat: [
      "Your guard breaks completely. {enemy} drives you back before you can find another angle.",
    ],
  },
};

export function getAvailableTechniqueActions(player: Player): Array<{ techniqueId: string; name: string; qiCost: number; mastery: number }> {
  return player.techniques
    .filter((id) => id in techniqueCombatData && player.techniqueMastery[id] >= 1)
    .map((id) => ({
      techniqueId: id,
      name: getTechniqueDisplayName(id),
      qiCost: techniqueCombatData[id].qiCost,
      mastery: player.techniqueMastery[id] ?? 0,
    }));
}

function getTechniqueDisplayName(techniqueId: string): string {
  const names: Record<string, string> = {
    azure_cloud_breathing: "Azure Cloud Strike",
    pine_shadow_step: "Shadow Step Strike",
    iron_body_method: "Iron Body Stance",
    wind_blade_strike: "Wind Blade",
    void_step: "Void Step",
    thunder_current_strike: "Thunder Current",
  };
  return names[techniqueId] ?? techniqueId;
}

export function startCombat(
  gameState: GameState,
  enemy: Enemy,
  victorySceneId: string,
  defeatSceneId: string,
): GameState {
  const powerTier = getCombatPowerTier(gameState.player, enemy);
  const narration = getCombatNarration(gameState.currentSceneId, powerTier);

  return {
    ...gameState,
    combat: {
      enemyId: enemy.id,
      enemyHealth: enemy.maxHealth,
      turn: 1,
      victorySceneId,
      defeatSceneId,
      log: [renderCombatLine(pickCombatLine(narration.opening, 0), enemy, 0)],
      powerTier,
      playerStartHealth: gameState.player.health,
    },
  };
}

export function resolveCombatAction(
  gameState: GameState,
  enemy: Enemy,
  action: CombatAction,
  techniqueId?: string,
): GameState {
  if (!gameState.combat) return gameState;

  if (action === "flee") {
    return {
      ...gameState,
      combat: null,
      currentSceneId: gameState.combat.defeatSceneId,
    };
  }

  if (action === "focus" && !canFocusQiInCombat(gameState.player)) return gameState;
  if (action === "weapon" && !gameState.player.equipment.weapon) return gameState;
  if (action === "technique") {
    if (!techniqueId || !canUseTechniqueInCombat(gameState.player, techniqueId)) return gameState;
  }

  const { powerTier } = gameState.combat;
  const playerDamage = getPlayerDamage(gameState.player, action, techniqueId);
  const enemyHealth = Math.max(0, gameState.combat.enemyHealth - playerDamage);
  const narration = getCombatNarration(gameState.currentSceneId, powerTier);
  const actionLog = renderCombatLine(
    getPlayerActionLine(gameState.player, action, narration, gameState.combat.turn, techniqueId),
    enemy,
    playerDamage,
  );

  if (enemyHealth <= 0) {
    return finishCombat(gameState, enemy, actionLog);
  }

  // Phase detection — fires once when health drops below threshold
  const phaseJustTriggered =
    !gameState.combat.phaseTriggered &&
    !!enemy.phase &&
    enemyHealth / enemy.maxHealth <= enemy.phase.threshold;

  const isPhased = gameState.combat.phaseTriggered || phaseJustTriggered;
  const techniqueDefenseBonus =
    action === "technique" && techniqueId
      ? (techniqueCombatData[techniqueId]?.defenseBonus ?? 0)
      : 0;
  const enemyDamage = getEnemyDamage(gameState.player, enemy, isPhased, techniqueDefenseBonus);
  const playerHealth = Math.max(0, gameState.player.health - enemyDamage);

  const enemyAttackLines =
    isPhased && enemy.phase?.attackLines
      ? enemy.phase.attackLines
      : narration.enemyAttack;

  const enemyLog = renderCombatLine(
    pickCombatLine(enemyAttackLines, gameState.combat.turn - 1),
    enemy,
    enemyDamage,
  );

  if (playerHealth <= 0) {
    return {
      ...gameState,
      currentSceneId: gameState.combat.defeatSceneId,
      combat: null,
      player: { ...gameState.player, health: 0 },
    };
  }

  const newEntries: string[] =
    phaseJustTriggered && enemy.phase
      ? [actionLog, enemy.phase.announcement, enemyLog]
      : [actionLog, enemyLog];

  const qiCost =
    action === "technique" && techniqueId
      ? (techniqueCombatData[techniqueId]?.qiCost ?? 3)
      : action === "focus"
        ? 2
        : 0;

  return {
    ...gameState,
    player: {
      ...gameState.player,
      health: playerHealth,
      qi: Math.max(0, gameState.player.qi - qiCost),
    },
    combat: {
      ...gameState.combat,
      enemyHealth,
      turn: gameState.combat.turn + 1,
      log: [...newEntries, ...gameState.combat.log].slice(0, 8),
      phaseTriggered: isPhased,
    },
  };
}

export function continueCombat(gameState: GameState): GameState {
  if (!gameState.combat?.resolved) return gameState;

  return {
    ...gameState,
    currentSceneId: gameState.combat.victorySceneId,
    combat: null,
  };
}

function finishCombat(gameState: GameState, enemy: Enemy, actionLog: string): GameState {
  const combat = gameState.combat as CombatState;
  const rewardedQi = Math.min(gameState.player.maxQi, gameState.player.qi + enemy.qiReward);
  const narration = getCombatNarration(gameState.currentSceneId, combat.powerTier);
  const victoryLine = renderCombatLine(
    pickCombatLine(narration.victory, combat.turn - 1),
    enemy,
    0,
  );

  const healthLost = Math.max(0, combat.playerStartHealth - gameState.player.health);
  const healthLostFraction = healthLost / Math.max(1, gameState.player.maxHealth);
  const reflection = generateCombatReflection(combat.powerTier, combat.turn, healthLostFraction);

  return {
    ...gameState,
    player: {
      ...gameState.player,
      qi: rewardedQi,
      spiritStones: gameState.player.spiritStones + (enemy.spiritStoneReward ?? 0),
      inventory: [...new Set([...gameState.player.inventory, ...(enemy.itemRewards ?? [])])],
      flags: {
        ...gameState.player.flags,
        [`defeated_${enemy.id}`]: true,
      },
    },
    combat: {
      ...combat,
      enemyHealth: 0,
      log: [victoryLine, actionLog, ...combat.log].slice(0, 8),
      resolved: true,
      reflection,
    },
  };
}

function generateCombatReflection(
  powerTier: CombatPowerTier,
  turnsToVictory: number,
  healthLostFraction: number,
): string {
  if (powerTier === "dominant") {
    if (healthLostFraction >= 0.25) {
      return "You won cleanly enough, but a few blows landed that should not have. Superior cultivation does not replace attention. You note the gaps and move on.";
    }
    if (turnsToVictory <= 2) {
      return "The fight was over before your breath changed. You register this not with pride, but as information. There is a gap between you and this kind of threat now. That gap is worth maintaining, not assuming permanent.";
    }
    return "The creature did not find what it was looking for in this fight. Some opponents are below the threshold of teaching you anything new. You move on.";
  }

  if (powerTier === "contested") {
    if (healthLostFraction >= 0.4) {
      return "You won. You also know how close the margin was. The difference between winning and losing was a single exchange in the middle that could have gone differently. You replay it once, then let it go.";
    }
    if (turnsToVictory <= 3) {
      return "A proper fight, handled cleanly. The technique held when the pressure came. That matters more than the outcome itself.";
    }
    return "Hard-fought. You found what you needed — not that you can win, but how. The gap between your strength and this level of threat is real, and now you have measured it properly.";
  }

  if (healthLostFraction >= 0.5) {
    return "You stood over the fallen creature and could not move for a moment. Qi depleted, breathing ragged. You won, but this kind of winning has a cost that compounds. Understand what it is before you do it again.";
  }
  if (turnsToVictory >= 6) {
    return "Alive. That is the accurate word right now — not victorious, not skilled. Just alive. When you have your breath back, that distinction will mean something.";
  }
  return "You found a way through something that had no business going your way at your current level. Note what worked. Note what nearly did not.";
}

function canUseTechniqueInCombat(player: Player, techniqueId: string): boolean {
  if (!player.techniques.includes(techniqueId)) return false;
  if (!(techniqueId in techniqueCombatData)) return false;
  const qiCost = techniqueCombatData[techniqueId]?.qiCost ?? 3;
  return player.qi >= qiCost && (player.techniqueMastery[techniqueId] ?? 0) >= 1;
}

function getTechniqueMasteryTier(mastery: number): TechniqueMasteryTier {
  if (mastery >= 5) return "mastered";
  if (mastery >= 3) return "practiced";
  return "novice";
}

function getPlayerCombatPower(player: Player): number {
  const techniqueBonus = player.techniques.includes("azure_cloud_breathing") ? 3 : 0;
  const masteryBonus = Math.floor((player.techniqueMastery["azure_cloud_breathing"] ?? 0) / 2);
  const skillBonus = getSkillEffectTotals(player).combatDamage;
  const defenseContribution = Math.floor((player.endurance + player.agility) / 4);

  return (
    player.physique +
    Math.floor(player.strength / 2) +
    Math.floor(player.agility / 4) +
    defenseContribution +
    techniqueBonus +
    masteryBonus +
    skillBonus
  );
}

function getEnemyCombatPower(enemy: Enemy): number {
  return enemy.attack * 2 + Math.floor(enemy.defense * 1.5) + Math.floor(enemy.maxHealth / 8);
}

function getCombatPowerTier(player: Player, enemy: Enemy): CombatPowerTier {
  const playerPower = getPlayerCombatPower(player);
  const enemyPower = getEnemyCombatPower(enemy);
  const ratio = playerPower / Math.max(1, enemyPower);

  if (ratio >= 1.8) return "dominant";
  if (ratio <= 0.65) return "struggling";
  return "contested";
}

function getPlayerDamage(player: Player, action: CombatAction, techniqueId?: string): number {
  if (action === "technique" && techniqueId) {
    const mastery = player.techniqueMastery[techniqueId] ?? 0;
    const tier = getTechniqueMasteryTier(mastery);
    const damageBonus = techniqueCombatData[techniqueId]?.damageBonusPerTier[tier] ?? 0;
    const skillBonus = getSkillEffectTotals(player).combatDamage;
    const windEssenceBonus =
      techniqueId === "wind_blade_strike"
        ? Math.floor((player.elementalEssence["Wind"] ?? 0) / 2)
        : 0;
    const lightningEssenceBonus =
      techniqueId === "thunder_current_strike"
        ? Math.floor((player.elementalEssence["Lightning"] ?? 0) / 2)
        : 0;
    return Math.max(1, 3 + player.physique + Math.floor(player.strength / 2) + damageBonus + skillBonus + windEssenceBonus + lightningEssenceBonus);
  }

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
    3 + player.physique + attributeBonus + techniqueBonus + focusBonus + skillBonus + equipmentBonus,
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
  techniqueId?: string,
): string {
  if (action === "technique" && techniqueId) {
    const mastery = player.techniqueMastery[techniqueId] ?? 0;
    const tier = getTechniqueMasteryTier(mastery);
    const lines = techniqueCombatData[techniqueId]?.strike[tier];
    if (lines) return pickCombatLine(lines, turn - 1);
  }

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

function getEnemyDamage(player: Player, enemy: Enemy, phased: boolean, techniqueDefenseBonus = 0): number {
  const skillDefense = getSkillEffectTotals(player).combatDefense;
  const equipmentDefense = getEquipmentEffectTotals(player).combatDefense;
  const attributeDefense = Math.floor((player.endurance + player.agility) / 4);
  const ironBodyPassive =
    (player.techniqueMastery["iron_body_method"] ?? 0) >= 5 ? 2 : 0;
  const base =
    enemy.attack -
    Math.floor(player.physique / 2) -
    attributeDefense -
    skillDefense -
    equipmentDefense -
    ironBodyPassive -
    techniqueDefenseBonus;
  const multiplier = phased ? (enemy.phase?.damageMultiplier ?? 1.0) : 1.0;

  return Math.max(1, Math.floor(base * multiplier));
}

function getEquipmentEffectTotals(player: Player): Required<EquipmentEffects> {
  return Object.values(player.equipment).reduce<Required<EquipmentEffects>>(
    (totals, itemId) => {
      const item = itemData.find((candidate) => candidate.id === itemId);

      return {
        combatDamage: totals.combatDamage + (item?.equipmentEffects?.combatDamage ?? 0),
        combatDefense: totals.combatDefense + (item?.equipmentEffects?.combatDefense ?? 0),
        maxHealth: totals.maxHealth + (item?.equipmentEffects?.maxHealth ?? 0),
        maxQi: totals.maxQi + (item?.equipmentEffects?.maxQi ?? 0),
      };
    },
    { combatDamage: 0, combatDefense: 0, maxHealth: 0, maxQi: 0 },
  );
}

function getCombatNarration(sceneId: string, powerTier: CombatPowerTier): Required<CombatNarration> {
  const scene = sceneData.find((candidate) => candidate.id === sceneId);
  const tierDefaults = tieredNarration[powerTier];

  return {
    opening: scene?.combatNarration?.opening ?? tierDefaults.opening,
    strike: scene?.combatNarration?.strike ?? tierDefaults.strike,
    focus: scene?.combatNarration?.focus ?? tierDefaults.focus,
    enemyAttack: scene?.combatNarration?.enemyAttack ?? tierDefaults.enemyAttack,
    victory: scene?.combatNarration?.victory ?? tierDefaults.victory,
    defeat: scene?.combatNarration?.defeat ?? tierDefaults.defeat,
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
