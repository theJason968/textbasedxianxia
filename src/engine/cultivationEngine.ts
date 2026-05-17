import type { GameState, Player, Realm, RealmStage } from "./types";
import { advancePlayerTime } from "./timeEngine";
import {
  applyBreakthroughRewards,
  getFoundationQualityLabel,
} from "./breakthroughEngine";

export type CultivationResult = {
  gameState: GameState;
  message: string;
};

const stageOrder: RealmStage[] = ["Early", "Middle", "Late", "Peak"];
const realmOrder: Realm[] = ["Mortal", "Qi Condensation", "Foundation Establishment"];

export function cultivate(gameState: GameState): CultivationResult {
  const hasBreathingMethod = gameState.player.techniques.includes(
    "azure_cloud_breathing",
  );

  if (!hasBreathingMethod) {
    return {
      gameState,
      message: "You need a cultivation method before meditation can gather qi.",
    };
  }

  const azureMastery = gameState.player.techniqueMastery["azure_cloud_breathing"] ?? 0;
  const rank5Bonus = azureMastery >= 5 ? 1 : 0;
  const qiGain = Math.max(1, 2 + rank5Bonus - Math.floor(gameState.player.trainingFatigue / 3));
  const nextQi = Math.min(gameState.player.maxQi, gameState.player.qi + qiGain);
  const nextFatigue = Math.min(10, gameState.player.trainingFatigue + 1);
  const isOvertraining = nextFatigue >= 4;
  const nextFoundation = Math.max(
    0,
    gameState.player.foundationStability - (isOvertraining ? 1 : 0),
  );
  const nextImpurity = gameState.player.impurity + (isOvertraining ? 1 : 0);

  const nextPlayer = advancePlayerTime(
    {
      ...gameState.player,
      qi: nextQi,
      trainingFatigue: nextFatigue,
      foundationStability: nextFoundation,
      impurity: nextImpurity,
    },
    1,
  );

  return {
    gameState: {
      ...gameState,
      player: nextPlayer,
    },
    message:
      nextQi >= gameState.player.maxQi
        ? "Your qi has reached its current limit. Find a safe place, special scene, or suitable item before attempting a breakthrough."
        : isOvertraining
          ? `You force another cycle and gather ${qiGain} qi, but fatigue strains your foundation.`
          : `You quietly circulate your method and gather ${qiGain} qi.`,
  };
}

export function canAttemptBreakthrough(player: Player): boolean {
  return player.qi >= player.maxQi;
}

export function attemptBreakthrough(gameState: GameState): CultivationResult {
  if (isMajorRealmBreakthrough(gameState.player)) {
    return {
      gameState,
      message:
        "A major realm breakthrough needs a prepared scene, stable foundation, and proper resources.",
    };
  }

  if (!canAttemptBreakthrough(gameState.player)) {
    return {
      gameState,
      message: "Your qi is not dense enough to challenge the next bottleneck.",
    };
  }

  const advancement = getNextCultivationStep(gameState.player);

  if (!advancement) {
    return {
      gameState,
      message: "You stand at the edge of the current prototype's cultivation path.",
    };
  }

  const breakthroughResult = applyBreakthroughRewards(gameState.player, {
    realm: advancement.realm,
    stage: advancement.stage,
    foundationCost: advancement.foundationCost,
  });

  return {
    gameState: {
      ...gameState,
      player: {
        ...breakthroughResult.player,
        cultivationInsight: Math.max(0, breakthroughResult.player.cultivationInsight - 1),
      },
    },
    message: `Breakthrough success. You advanced to ${advancement.realm} ${advancement.stage} with ${getFoundationQualityLabel(
      breakthroughResult.quality,
    )}.`,
  };
}

function isMajorRealmBreakthrough(player: Player): boolean {
  return player.stage === "Peak";
}

function getNextCultivationStep(player: Player):
  | {
      realm: Realm;
      stage: RealmStage;
      foundationCost: number;
    }
  | null {
  const currentStageIndex = stageOrder.indexOf(player.stage);

  if (currentStageIndex < stageOrder.length - 1) {
    return {
      realm: player.realm,
      stage: stageOrder[currentStageIndex + 1],
      foundationCost: 2,
    };
  }

  const currentRealmIndex = realmOrder.indexOf(player.realm);

  if (currentRealmIndex < realmOrder.length - 1) {
    return {
      realm: realmOrder[currentRealmIndex + 1],
      stage: "Early",
      foundationCost: 5,
    };
  }

  return null;
}
