import type { FoundationQuality, Player, Realm, RealmStage } from "./types";

export type BreakthroughInput = {
  realm?: Realm;
  stage: RealmStage;
  foundationQuality?: FoundationQuality;
  foundationCost?: number;
};

export type BreakthroughResult = {
  player: Player;
  quality: FoundationQuality;
};

export type FoundationOutlook = {
  quality: FoundationQuality;
  title: string;
  body: string;
  helpfulSigns: string[];
  risks: string[];
};

const coreStatKeys = [
  "strength",
  "agility",
  "endurance",
  "intelligence",
  "perception",
  "spiritualSense",
  "physique",
  "comprehension",
] as const;

const alignedStatPriority: Array<(typeof coreStatKeys)[number]> = [
  "physique",
  "spiritualSense",
  "comprehension",
  "strength",
  "endurance",
  "agility",
  "perception",
  "intelligence",
];

const foundationQualityLabels: Record<FoundationQuality, string> = {
  fractured: "Fractured Foundation",
  unstable: "Unstable Foundation",
  stable: "Stable Foundation",
  refined: "Refined Foundation",
  perfect: "Perfect Foundation",
};

export function getFoundationQualityLabel(quality?: FoundationQuality): string {
  return quality ? foundationQualityLabels[quality] : "Unformed Foundation";
}

export function getFoundationOutlook(player: Player): FoundationOutlook {
  const quality = determineFoundationQuality(player);
  const helpfulSigns = getHelpfulFoundationSigns(player);
  const risks = getFoundationRisks(player);

  return {
    quality,
    title: getFoundationQualityLabel(quality),
    body: getFoundationOutlookBody(quality),
    helpfulSigns,
    risks,
  };
}

export function applyBreakthroughRewards(
  player: Player,
  breakthrough: BreakthroughInput,
): BreakthroughResult {
  const quality = breakthrough.foundationQuality ?? determineFoundationQuality(player);
  const statGains = getFoundationStatGains(player, quality);
  const maxQiIncrease = getFoundationMaxQiIncrease(quality);
  const maxHealthIncrease = getFoundationMaxHealthIncrease(quality);
  const foundationCost = breakthrough.foundationCost ?? 0;
  const foundationStabilityExtra = getFoundationStabilityExtra(quality);
  const impurityExtra = getFoundationImpurityExtra(quality);
  const cultivationInsightExtra = quality === "perfect" ? 3 : 0;
  const nextFlags = {
    ...player.flags,
    last_breakthrough_foundation: quality,
    ...(quality === "unstable" ? { unstable_foundation: true } : {}),
    ...(quality === "perfect"
      ? {
          perfect_foundation_trait: "flawless_mortal_root",
        }
      : {}),
  };
  const nextMaxHealth = player.maxHealth + maxHealthIncrease;
  const nextPlayer = coreStatKeys.reduce<Player>(
    (currentPlayer, key) => ({
      ...currentPlayer,
      [key]: currentPlayer[key] + statGains[key],
    }),
    {
      ...player,
      realm: breakthrough.realm ?? player.realm,
      stage: breakthrough.stage,
      foundationQuality: quality,
      qi: 0,
      maxQi: player.maxQi + maxQiIncrease,
      maxHealth: nextMaxHealth,
      health: Math.min(player.health + maxHealthIncrease, nextMaxHealth),
      foundationStability: Math.max(
        0,
        player.foundationStability - foundationCost + foundationStabilityExtra,
      ),
      impurity: Math.max(0, player.impurity + impurityExtra),
      cultivationInsight: player.cultivationInsight + cultivationInsightExtra,
      trainingFatigue: Math.max(0, player.trainingFatigue - 2),
      flags: nextFlags,
    },
  );

  return {
    player: nextPlayer,
    quality,
  };
}

export function determineFoundationQuality(player: Player): FoundationQuality {
  const score =
    player.foundationStability -
    player.impurity * 3 -
    player.trainingFatigue * 4 +
    player.cultivationInsight * 3 +
    (player.techniqueMastery["azure_cloud_breathing"] ?? 0) * 2 +
    (player.techniqueMastery["iron_body_method"] ?? 0);

  if (score >= 105) {
    return "perfect";
  }

  if (score >= 85) {
    return "refined";
  }

  if (score >= 60) {
    return "stable";
  }

  if (score >= 35) {
    return "unstable";
  }

  return "fractured";
}

function getHelpfulFoundationSigns(player: Player): string[] {
  const azureMastery = player.techniqueMastery["azure_cloud_breathing"] ?? 0;
  const ironBodyMastery = player.techniqueMastery["iron_body_method"] ?? 0;

  return [
    player.foundationStability >= 95
      ? "Your foundation feels unusually steady."
      : player.foundationStability >= 80
        ? "Your foundation is holding together."
        : null,
    player.impurity <= 0 ? "Your meridians feel clean." : null,
    player.trainingFatigue <= 0 ? "Your breath is calm and unforced." : null,
    player.cultivationInsight >= 3
      ? "Recent insight helps you read the bottleneck."
      : player.cultivationInsight > 0
        ? "You have some insight to guide the attempt."
        : null,
    azureMastery >= 3
      ? "Azure Cloud Breathing is familiar enough to steady the circulation."
      : azureMastery > 0
        ? "Azure Cloud Breathing gives you a usable route."
        : null,
    ironBodyMastery >= 3
      ? "Iron Body Method gives the body a firm vessel."
      : ironBodyMastery > 0
        ? "Iron Body Method adds a little resilience."
        : null,
  ].filter((sign): sign is string => sign !== null);
}

function getFoundationRisks(player: Player): string[] {
  return [
    player.foundationStability < 60
      ? "The foundation is too loose for a clean attempt."
      : player.foundationStability < 85
        ? "The foundation could still be steadier."
        : null,
    player.impurity >= 4
      ? "Impurity is weighing heavily on the meridians."
      : player.impurity > 0
        ? "Trace impurity may dull the result."
        : null,
    player.trainingFatigue >= 4
      ? "Fatigue makes forcing the bottleneck dangerous."
      : player.trainingFatigue > 0
        ? "Some fatigue remains in the body."
        : null,
    player.cultivationInsight <= 0
      ? "You lack fresh insight into the bottleneck."
      : null,
    !player.techniques.includes("azure_cloud_breathing")
      ? "A proper breathing method would make the route safer."
      : null,
  ].filter((risk): risk is string => risk !== null);
}

function getFoundationOutlookBody(quality: FoundationQuality): string {
  const bodies: Record<FoundationQuality, string> = {
    fractured:
      "The signs are poor. Something would give way if you forced the boundary now.",
    unstable:
      "The bottleneck may open, but the qi would not settle cleanly.",
    stable:
      "The route looks usable. It should hold, though little about it feels exceptional.",
    refined:
      "The signs are strong. With patience, the breakthrough could leave a clean foundation.",
    perfect:
      "The signs are excellent. Breath, meridians, and foundation move in rare harmony.",
  };

  return bodies[quality];
}

function getFoundationStatGains(
  player: Player,
  quality: FoundationQuality,
): Record<(typeof coreStatKeys)[number], number> {
  if (quality === "fractured") {
    return buildStatGainMap(player, 2, [5, 4, 3]);
  }

  if (quality === "unstable") {
    return buildFlatStatGainMap(3);
  }

  if (quality === "stable") {
    return buildFlatStatGainMap(5);
  }

  if (quality === "refined") {
    return buildStatGainMap(player, 5, [7, 7]);
  }

  return buildStatGainMap(player, 10, [13, 13]);
}

function buildFlatStatGainMap(
  gain: number,
): Record<(typeof coreStatKeys)[number], number> {
  return coreStatKeys.reduce<Record<(typeof coreStatKeys)[number], number>>(
    (gains, key) => ({
      ...gains,
      [key]: gain,
    }),
    {} as Record<(typeof coreStatKeys)[number], number>,
  );
}

function buildStatGainMap(
  player: Player,
  baseGain: number,
  alignedGains: number[],
): Record<(typeof coreStatKeys)[number], number> {
  const alignedStats = getAlignedStats(player, alignedGains.length);
  const gains = buildFlatStatGainMap(baseGain);

  alignedStats.forEach((key, index) => {
    gains[key] = alignedGains[index] ?? baseGain;
  });

  return gains;
}

function getAlignedStats(player: Player, count: number): Array<(typeof coreStatKeys)[number]> {
  return [...coreStatKeys]
    .sort((first, second) => {
      const statDifference = player[second] - player[first];

      if (statDifference !== 0) {
        return statDifference;
      }

      return alignedStatPriority.indexOf(first) - alignedStatPriority.indexOf(second);
    })
    .slice(0, count);
}

function getFoundationMaxQiIncrease(quality: FoundationQuality): number {
  const increases: Record<FoundationQuality, number> = {
    fractured: 5,
    unstable: 7,
    stable: 12,
    refined: 14,
    perfect: 22,
  };

  return increases[quality];
}

function getFoundationMaxHealthIncrease(quality: FoundationQuality): number {
  const increases: Record<FoundationQuality, number> = {
    fractured: 2,
    unstable: 7,
    stable: 10,
    refined: 12,
    perfect: 15,
  };

  return increases[quality];
}

function getFoundationStabilityExtra(quality: FoundationQuality): number {
  const changes: Record<FoundationQuality, number> = {
    fractured: 0,
    unstable: -5,
    stable: 0,
    refined: 5,
    perfect: 0,
  };

  return changes[quality];
}

function getFoundationImpurityExtra(quality: FoundationQuality): number {
  const changes: Record<FoundationQuality, number> = {
    fractured: 6,
    unstable: 2,
    stable: 0,
    refined: 0,
    perfect: 0,
  };

  return changes[quality];
}
