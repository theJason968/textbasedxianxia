import { useEffect, useMemo, useState, type FormEvent } from "react";
import { QuestBoardScene } from "./components/QuestBoardScene";
import { Backpack, BookOpen, ListChecks, ScrollText, Swords, Workflow } from "lucide-react";
import scenes from "./data/scenes.json";
import items from "./data/items.json";
import techniques from "./data/techniques.json";
import skills from "./data/skills.json";
import constitutions from "./data/constitutions.json";
import enemies from "./data/enemies.json";
import quests from "./data/quests.json";
import npcs from "./data/npcs.json";
import craftingRecipes from "./data/craftingRecipes.json";
import sceneAreas from "./data/sceneAreas.json";
import { continueCombat, getAvailableTechniqueActions, resolveCombatAction, type CombatAction } from "./engine/combatEngine";
import { getPostCombatChoices, resolvePostCombatChoice } from "./engine/postCombatEngine";
import type { PostCombatChoiceId } from "./engine/types";
import { canChoose } from "./engine/conditionEngine";
import {
  getFoundationOutlook,
  getFoundationQualityLabel,
} from "./engine/breakthroughEngine";
import {
  attemptCraftingBottleneck,
  canCraftRecipe,
  craftRecipe,
  getCraftingBottleneckAttempt,
  getCraftingFacilityLocationHint,
  getCraftingFacilityRequirementLabel,
  getCraftingFacilityTier,
  getCraftingFacilityUnlockHint,
  getInventoryCounts,
  hasCraftingFacilityLocation,
  hasRequiredFacility,
  type CraftingContext,
  type CraftingFacility,
  type CraftingFacilityTier,
  type CraftingRecipe,
  type CraftingSkillBreakthroughResult,
} from "./engine/craftingEngine";
import {
  applyChoiceWithResult,
  getPlayerChangeMessages,
} from "./engine/consequenceEngine";
import { cultivate } from "./engine/cultivationEngine";
import { formatCalendarTime } from "./engine/timeEngine";
import { createInitialGameState } from "./engine/gameState";
import { equipItem, unequipItem, useItem } from "./engine/itemEngine";
import {
  clearSavedGame,
  getSaveSlots,
  hasAnySavedGame,
  loadGame,
  loadLatestGame,
  saveGame,
  type SaveSlot,
} from "./engine/saveEngine";
import {
  clearStoredSession,
  continueAsGuest,
  getStoredSession,
  loginProfile,
  registerProfile,
  type ProfileSession,
} from "./engine/profileEngine";
import {
  getResolvedSceneImage,
  getSceneAreaById,
  getSceneById,
} from "./engine/sceneEngine";
import {
  formatSkillEffectSummary,
  formatSkillLevel,
  getSkillBottleneckSuccessChance,
  getSkillDisplayedExp,
  getSkillExpRequiredForRank,
  getSkillLevelName,
  getSkillPracticeRequiredForRank,
  isSkillAtBottleneck,
} from "./engine/skillEngine";
import type {
  Choice,
  CharacterGender,
  Constitution,
  ElementalEssence,
  Enemy,
  EquipmentEffects,
  EquipmentSlot,
  FoundationQuality,
  ItemTier,
  Npc,
  Player,
  Quest,
  Scene,
  SceneArea,
  Skill,
} from "./engine/types";

const sceneData = scenes as Scene[];
const skillData = skills as Skill[];
const constitutionData = constitutions as Constitution[];
const enemyData = enemies as Enemy[];
const npcData = npcs as unknown as Npc[];
const questData = quests as Quest[];
const recipeData = craftingRecipes as unknown as CraftingRecipe[];
const sceneAreaData = sceneAreas as SceneArea[];
type PackTab = "inventory" | "crafting";
type PathTab = "quests" | "journal" | "techniques" | "skills";
type RightPanelTab = "stats" | "pack" | "path" | "save";
type StartView = "auth" | "character" | "game";
type CraftingFilter = "All" | "Craftable" | "Locked Requirements" | string;
type CraftingFacilityView = {
  id: CraftingFacility;
  label: string;
};
type DelayedChoiceState = {
  choice: Choice;
  progress: number;
  stageIndex: number;
};
type DiscoveryResult = {
  title: string;
  body: string;
  rewards: string[];
};
type BreakthroughResultView = {
  realmLine: string;
  qualityLabel: string;
  flavor: string;
  rewards: string[];
};
type SkillBreakthroughResultView = {
  outcome: "success" | "failure";
  imagePath: string;
  title: string;
  subtitle: string;
  flavor: string;
  rewards: string[];
  continueLabel: string;
};
type ItemData = {
  id: string;
  name: string;
  category?: string;
  rarity?: string;
  tier?: ItemTier;
  description?: string;
  icon?: string;
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
      | "corruption"
    >
  >;
};
const itemData = items as ItemData[];
const breakthroughImagePath = "/assets/story/breakthrough_success.png";
const skillBreakthroughImagePaths: Record<
  Skill["tree"] | "Crafting",
  { success: string; failure: string }
> = {
  "Mortal Foundation": {
    success: "/assets/skill_breakthroughs/cultivation_foundation_success.png",
    failure: "/assets/skill_breakthroughs/cultivation_foundation_failure.jpg",
  },
  "Martial Arts": {
    success: "/assets/skill_breakthroughs/martial_arts_success.jpg",
    failure: "/assets/skill_breakthroughs/martial_arts_failure.jpg",
  },
  "Body Tempering": {
    success: "/assets/skill_breakthroughs/crafting_success.jpg",
    failure: "/assets/skill_breakthroughs/crafting_failure.jpg",
  },
  "Mind And Perception": {
    success: "/assets/skill_breakthroughs/mind_perception_success.jpg",
    failure: "/assets/skill_breakthroughs/mind_perception_failure.jpg",
  },
  "Social Bearing": {
    success: "/assets/skill_breakthroughs/crafting_success.jpg",
    failure: "/assets/skill_breakthroughs/crafting_failure.jpg",
  },
  Survival: {
    success: "/assets/skill_breakthroughs/survival_success.jpg",
    failure: "/assets/skill_breakthroughs/survival_failure.jpg",
  },
  Alchemy: {
    success: "/assets/skill_breakthroughs/alchemy_success.png",
    failure: "/assets/skill_breakthroughs/alchemy_failure.png",
  },
  Blacksmithing: {
    success: "/assets/skill_breakthroughs/blacksmithing_success.png",
    failure: "/assets/skill_breakthroughs/blacksmithing_failure.jpg",
  },
  "Cultivation Foundation": {
    success: "/assets/skill_breakthroughs/cultivation_foundation_success.png",
    failure: "/assets/skill_breakthroughs/cultivation_foundation_failure.jpg",
  },
  "Azure Cloud Methods": {
    success: "/assets/skill_breakthroughs/cultivation_foundation_success.png",
    failure: "/assets/skill_breakthroughs/cultivation_foundation_failure.jpg",
  },
  Crafting: {
    success: "/assets/skill_breakthroughs/crafting_success.jpg",
    failure: "/assets/skill_breakthroughs/crafting_failure.jpg",
  },
};

const craftingFacilities: CraftingFacilityView[] = [
  {
    id: "field_kit",
    label: "Field Kit",
  },
  {
    id: "alchemy_room",
    label: "Alchemy Room",
  },
  {
    id: "blacksmithing_room",
    label: "Forge",
  },
];

function getRealmDisplay(player: Player): string {
  const realmStage = `${player.realm} ${player.stage}`;

  return player.foundationQuality
    ? `${realmStage} (${getFoundationQualityLabel(player.foundationQuality)})`
    : realmStage;
}

const breakthroughRewardStats: Array<
  keyof Pick<
    Player,
    | "strength"
    | "agility"
    | "endurance"
    | "intelligence"
    | "perception"
    | "spiritualSense"
    | "physique"
    | "comprehension"
    | "maxQi"
    | "maxHealth"
    | "foundationStability"
    | "impurity"
    | "cultivationInsight"
  >
> = [
  "strength",
  "agility",
  "endurance",
  "intelligence",
  "perception",
  "spiritualSense",
  "physique",
  "comprehension",
  "maxQi",
  "maxHealth",
  "foundationStability",
  "impurity",
  "cultivationInsight",
];

const breakthroughRewardLabels: Record<(typeof breakthroughRewardStats)[number], string> = {
  strength: "Strength",
  agility: "Agility",
  endurance: "Endurance",
  intelligence: "Intelligence",
  perception: "Perception",
  spiritualSense: "Spiritual Sense",
  physique: "Physique",
  comprehension: "Comprehension",
  maxQi: "Max Qi",
  maxHealth: "Max Health",
  foundationStability: "Foundation Stability",
  impurity: "Impurity",
  cultivationInsight: "Cultivation Insight",
};

const breakthroughFlavorByQuality: Record<FoundationQuality, string> = {
  fractured:
    "The boundary gives way unevenly. Power enters, but not cleanly. You steady your breath around the cracks and understand that survival is still a kind of progress.",
  unstable:
    "The pressure opens inside you in uneven waves. Your meridians hold, but the qi does not settle all at once. You breathe until the shaking becomes rhythm.",
  stable:
    "The knot in your body loosens. Breath returns first, then warmth, then the quiet certainty that the path ahead has widened.",
  refined:
    "The qi does not break through you. It fits. Bone, breath, and meridian answer together, and for a moment your whole body feels carved into a cleaner shape.",
  perfect:
    "There is no thunder. No waste. The barrier dissolves as if it had only been waiting for you to arrive correctly. The world sharpens around your next breath.",
};

function getBreakthroughResultView(
  previousPlayer: Player,
  nextPlayer: Player,
): BreakthroughResultView | null {
  const advanced =
    previousPlayer.realm !== nextPlayer.realm || previousPlayer.stage !== nextPlayer.stage;

  if (!advanced || !nextPlayer.foundationQuality) {
    return null;
  }

  const rewards = breakthroughRewardStats
    .map((key) => {
      const difference = nextPlayer[key] - previousPlayer[key];

      if (difference === 0) {
        return null;
      }

      const signedDifference = difference > 0 ? `+${difference}` : `${difference}`;
      return `${signedDifference} ${breakthroughRewardLabels[key]}`;
    })
    .filter((reward): reward is string => reward !== null);

  return {
    realmLine: getRealmDisplay(nextPlayer),
    qualityLabel: getFoundationQualityLabel(nextPlayer.foundationQuality),
    flavor: breakthroughFlavorByQuality[nextPlayer.foundationQuality],
    rewards,
  };
}

function getSkillBreakthroughResultView(
  recipe: CraftingRecipe,
  result: CraftingSkillBreakthroughResult,
): SkillBreakthroughResultView {
  const images = skillBreakthroughImagePaths[result.tree];
  const imagePath = result.success ? images.success : images.failure;
  const skillLine = result.skillNames.join(", ");
  const rewards = result.success
    ? [
        `Crafted ${recipe.quantity} ${recipe.name}`,
        ...result.skillIds.map((skillId, index) => {
          const nextRank = result.nextRanks[skillId] ?? 0;
          const nextLevel = getSkillLevelName(nextRank);

          return `${result.skillNames[index] ?? skillId} reached ${nextLevel} ${nextRank}`;
        }),
      ]
    : [
        "No item crafted",
        "Materials survived the failed attempt",
        `Next success chance: ${result.nextChance}%`,
      ];

  return {
    outcome: result.success ? "success" : "failure",
    imagePath,
    title: result.success ? "Skill Breakthrough" : "Breakthrough Failed",
    subtitle: result.success
      ? `${skillLine} answered the pressure.`
      : `${skillLine} did not cross the threshold.`,
    flavor: result.success
      ? "The work holds. What used to be careful imitation settles into instinct, and the recipe becomes proof that the skill has grown teeth."
      : "The pattern slips at the final breath. Nothing is wasted, but the failure leaves a clear scar in memory, making the next attempt less uncertain.",
    rewards,
    continueLabel: result.success ? "Hold The Result" : "Try Again Later",
  };
}

type RecipeIngredientDetail = {
  itemId: string;
  name: string;
  requiredCount: number;
  ownedCount: number;
  hasEnough: boolean;
};
type LearnedTechniqueView = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  realmRequirement?: string;
  maxLevel: number;
  mastery: number;
  effectsPerLevel: Record<string, number>;
};
type LearnedSkillView = Skill & {
  rank: number;
  practice: number;
  bottleneckFailures: number;
};
const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: "Weapon",
  clothing: "Clothing",
  ring: "Ring",
  accessory: "Accessory",
};
const equipmentSlots: EquipmentSlot[] = ["weapon", "clothing", "ring", "accessory"];
const statRequirementLabels: Partial<Record<keyof Player, string>> = {
  health: "Health",
  qi: "Qi",
  strength: "Strength",
  agility: "Agility",
  endurance: "Endurance",
  intelligence: "Intelligence",
  perception: "Perception",
  spiritualSense: "Spiritual Sense",
  physique: "Physique",
  comprehension: "Comprehension",
  willpower: "Willpower",
  karma: "Karma",
  foundationStability: "Foundation Stability",
  trainingFatigue: "Training Fatigue",
  impurity: "Impurity",
  cultivationInsight: "Cultivation Insight",
  daysRemainingToExam: "Days Remaining",
  spiritStones: "Spirit Stones",
  corruption: "Corruption",
};
const itemTierLabels: Record<ItemTier, string> = {
  mortal: "Mortal",
  low_grade_spirit: "Low-Grade Spirit",
  mid_grade_spirit: "Mid-Grade Spirit",
  high_grade_spirit: "High-Grade Spirit",
  earth: "Earth",
  heaven: "Heaven",
  profound: "Profound",
  saint: "Saint",
  immortal: "Immortal",
  dao: "Dao",
};
const mortalVillageScenes = new Set([
  "pre_exam_days",
  "sect_exam_qi_warning",
  "river_stone_ford",
  "river_stone_training",
  "river_body_tempering_breakthrough",
  "waterfall_stance",
  "abandoned_threshing_yard",
  "village_fist_drills",
  "mortal_sparring_success",
  "mortal_sparring_bruises",
  "bamboo_staff_practice",
  "village_herbalist_hut",
  "herb_sorting_lesson",
  "road_tonic_lesson",
  "crude_elixir_clean_batch",
  "crude_elixir_smoky_batch",
  "village_forge_yard",
  "bellows_work",
  "scrap_iron_lesson",
  "staff_reinforcement",
  "family_courtyard",
  "last_ordinary_meal",
  "village_shrine_incense",
  "road_packing",
  "village_teacher_circle",
  "village_square_intro",
  "old_ren_road_rumor",
  "aunt_lin_road_rumor",
  "guo_road_rumor",
  "mei_road_rumor",
  "roadside_search_after_lotus",
  "village_token_questions",
  "old_ren_token_clue",
  "aunt_lin_token_clue",
  "guo_token_clue",
  "mei_token_clue",
  "immortal_senses_token",
  "old_ren_stance_test",
  "old_ren_corrected_stance",
  "old_ren_foundation_drills",
  "aunt_lin_medicine_task",
  "aunt_lin_clean_medicine",
  "aunt_lin_smoke_and_scolding",
  "guo_honest_iron",
  "guo_clean_temper",
  "guo_ruined_temper",
  "mei_three_breaths",
  "mei_still_smoke",
  "mei_unsteady_smoke",
  "bandit_road_healing_supplies",
  "bandit_road_cooling_remedy",
]);
const mountainTrialScenes = new Set([
  "mountain_gate",
  "exam_registration",
  "elder_selection_courtyard",
  "martial_hall_elder_notice",
  "medicine_hall_elder_notice",
  "craft_hall_elder_notice",
  "senior_disciple_mountain_tour",
  "exam_waiting_ground",
  "liu_zhen_intro",
  "han_yue_intro",
  "qiao_min_intro",
  "exam_pressure_stair",
  "steady_climb",
  "staff_aided_climb",
  "reckless_climb",
  "first_platform",
  "the_first_trial",
  "tablet_hidden_current",
  "tablet_test",
  "exam_second_trial",
  "cloud_mirror_clear",
  "cloud_mirror_shaken",
  "exam_third_trial",
  "exam_hidden_trial",
  "exam_mercy_choice",
  "exam_honest_exit",
  "exam_ambition_choice",
  "exam_ranking",
  "first_teaching",
  "pine_breath_training",
  "outer_disciple_accepted",
  "lower_grove_explore_rare",
  "lower_grove_explore_herbs",
  "lower_grove_explore_common",
  "mist_wolf_ambush",
  "mist_wolf_defeated",
  "spirit_core_study",
  "mist_wolf_escape",
]);

function hasLearnedAboutMountainGate(player: Player): boolean {
  return player.flags.learned_about_azure_cloud_exam === true;
}

function getSceneLocationTitle(sceneId: string): string {
  if (mortalVillageScenes.has(sceneId)) {
    return "Mortal Village";
  }

  if (mountainTrialScenes.has(sceneId)) {
    return "Azure Cloud Mountain";
  }

  return "Outer Sect";
}

function getFallbackSceneAreaId(sceneId: string): string {
  if (
    sceneId === "exam_registration" ||
    sceneId === "elder_selection_courtyard" ||
    sceneId === "martial_hall_elder_notice" ||
    sceneId === "medicine_hall_elder_notice" ||
    sceneId === "craft_hall_elder_notice" ||
    sceneId === "senior_disciple_mountain_tour"
  ) {
    return "azure_cloud_registration";
  }

  if (sceneId.startsWith("lower_grove") || sceneId.includes("mist_wolf")) {
    return "lower_grove";
  }

  if (sceneId.includes("scripture")) {
    return "scripture_pavilion";
  }

  if (sceneId.includes("medicine_garden") || sceneId.includes("garden_work")) {
    return "medicine_garden";
  }

  if (sceneId.includes("arena")) {
    return "arena";
  }

  if (sceneId.includes("cloud_edge")) {
    return "cloud_edge";
  }

  if (
    sceneId.startsWith("outer_") ||
    sceneId.includes("breathing_platform") ||
    sceneId.includes("pine_shadow") ||
    sceneId.includes("assignment_hall")
  ) {
    return "outer_sect";
  }

  if (mortalVillageScenes.has(sceneId)) {
    return "mortal_village";
  }

  if (mountainTrialScenes.has(sceneId)) {
    return "azure_cloud_mountain";
  }

  return "outer_sect";
}

function getChoiceRequirementSummary(player: Player, choice: Choice): string[] {
  const requirements = choice.requires;

  if (!requirements) {
    return [];
  }

  const messages: string[] = [];

  if (requirements.realm && player.realm !== requirements.realm) {
    messages.push(`${requirements.realm} realm`);
  }

  if (requirements.stage && player.stage !== requirements.stage) {
    messages.push(`${requirements.stage} stage`);
  }

  Object.entries(requirements.stats ?? {}).forEach(([key, requiredValue]) => {
    const statKey = key as keyof Player;
    const currentValue = player[statKey];

    if (typeof currentValue === "number" && currentValue < requiredValue) {
      messages.push(
        `${statRequirementLabels[statKey] ?? key} ${requiredValue} (${currentValue})`,
      );
    }
  });

  (requirements.items ?? [])
    .filter((itemId) => !player.inventory.includes(itemId))
    .forEach((itemId) => messages.push(getNamedRequirement(itemData, itemId)));

  (requirements.techniques ?? [])
    .filter((techniqueId) => !player.techniques.includes(techniqueId))
    .forEach((techniqueId) => messages.push(getNamedRequirement(techniques, techniqueId)));

  Object.entries(requirements.skills ?? {}).forEach(([skillId, requiredRank]) => {
    const currentRank = player.skills[skillId] ?? 0;

    if (currentRank < requiredRank) {
      messages.push(
        `${getNamedRequirement(skillData, skillId)} rank ${requiredRank} (${currentRank})`,
      );
    }
  });

  Object.entries(requirements.techniqueMastery ?? {}).forEach(
    ([techniqueId, requiredMastery]) => {
      const currentMastery = player.techniqueMastery[techniqueId] ?? 0;

      if (currentMastery < requiredMastery) {
        messages.push(
          `${getNamedRequirement(techniques, techniqueId)} mastery ${requiredMastery} (${currentMastery})`,
        );
      }
    },
  );

  Object.entries(requirements.elements ?? {}).forEach(([element, requiredAmount]) => {
    const currentAmount = player.elementalEssence[element as ElementalEssence] ?? 0;

    if (currentAmount < requiredAmount) {
      messages.push(`${element} essence ${requiredAmount} (${currentAmount})`);
    }
  });

  (requirements.constitutions ?? [])
    .filter((constitutionId) => !player.constitutions.includes(constitutionId))
    .forEach((constitutionId) =>
      messages.push(getNamedRequirement(constitutionData, constitutionId)),
    );

  Object.entries(requirements.relationships ?? {}).forEach(([scoreId, requiredValue]) => {
    const currentValue = player.relationships[scoreId] ?? 0;

    if (currentValue < requiredValue) {
      messages.push(`Relationship ${formatScoreLabel(scoreId)} ${requiredValue} (${currentValue})`);
    }
  });

  Object.entries(requirements.reputation ?? {}).forEach(([scoreId, requiredValue]) => {
    const currentValue = player.reputation[scoreId] ?? 0;

    if (currentValue < requiredValue) {
      messages.push(`Reputation ${formatScoreLabel(scoreId)} ${requiredValue} (${currentValue})`);
    }
  });

  Object.entries(requirements.morality ?? {}).forEach(([scoreId, requiredValue]) => {
    const currentValue = player.morality[scoreId] ?? 0;

    if (currentValue < requiredValue) {
      messages.push(`Morality ${formatScoreLabel(scoreId)} ${requiredValue} (${currentValue})`);
    }
  });

  Object.entries(requirements.sectContribution ?? {}).forEach(
    ([scoreId, requiredValue]) => {
      const currentValue = player.sectContribution[scoreId] ?? 0;

      if (currentValue < requiredValue) {
        messages.push(
          `Sect Contribution ${formatScoreLabel(scoreId)} ${requiredValue} (${currentValue})`,
        );
      }
    },
  );

  if (
    typeof requirements.corruption === "number" &&
    player.corruption < requirements.corruption
  ) {
    messages.push(`Corruption ${requirements.corruption} (${player.corruption})`);
  }

  Object.entries(requirements.flags ?? {}).forEach(([flag, requiredValue]) => {
    if (player.flags[flag] !== requiredValue) {
      messages.push(formatFlagRequirement(flag, requiredValue));
    }
  });

  return messages;
}

function getChoiceCheckSummary(choice: Choice): string[] {
  const checkLabels = new Set<string>();

  choice.outcomes?.forEach((outcome) => {
    Object.keys(outcome.requires?.skills ?? {}).forEach((skillId) => {
      const skillName = skillData.find((skill) => skill.id === skillId)?.name ?? skillId;

      checkLabels.add(`${skillName} check`);
    });
  });

  return Array.from(checkLabels);
}

function isCheckResultMessage(message: string): boolean {
  return /^\[[^\]]+\] Check (Passed|Failed)!$/.test(message);
}

function getNamedRequirement(
  data: Array<{ id: string; name: string }>,
  id: string,
): string {
  return data.find((candidate) => candidate.id === id)?.name ?? id;
}

function formatFlagRequirement(
  flag: string,
  requiredValue: boolean | number | string,
): string {
  const label = flag
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return typeof requiredValue === "boolean" ? label : `${label}: ${requiredValue}`;
}

function formatScoreLabel(scoreId: string): string {
  return scoreId
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getScoreEntries(scores: Record<string, number>): Array<[string, number]> {
  return Object.entries(scores).sort(([firstScore], [secondScore]) =>
    firstScore.localeCompare(secondScore),
  );
}

function formatSaveTime(savedAt?: string): string {
  if (!savedAt) {
    return "Empty";
  }

  return new Date(savedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSaveSceneTitle(sceneId?: string): string {
  if (!sceneId) {
    return "No saved path";
  }

  return sceneData.find((scene) => scene.id === sceneId)?.title ?? sceneId;
}

function renderSlotIcon(icon: string | undefined, label: string) {
  return icon ? (
    <img alt="" aria-hidden="true" className="slot-image" src={icon} />
  ) : (
    <span className="slot-icon">{label.slice(0, 1)}</span>
  );
}

function formatEquipmentEffects(effects: EquipmentEffects): string {
  return [
    effects.combatDamage ? `+${effects.combatDamage} damage` : null,
    effects.combatDefense ? `+${effects.combatDefense} defense` : null,
    effects.maxHealth ? `+${effects.maxHealth} max health` : null,
    effects.maxQi ? `+${effects.maxQi} max qi` : null,
  ]
    .filter((effect) => effect !== null)
    .join(", ");
}

function formatItemEffects(
  effects: ItemData["effects"],
  variant: "short" | "sentence" = "short",
): string {
  const effectEntries = Object.entries(effects)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([key, value]) => {
      const statKey = key as keyof Player;
      const label = statRequirementLabels[statKey] ?? formatScoreLabel(key);
      const signedValue = value > 0 ? `+${value}` : `${value}`;

      return `${signedValue} ${label}`;
    });

  if (effectEntries.length <= 0) {
    return "";
  }

  return variant === "sentence"
    ? `Use effect: ${effectEntries.join(", ")}`
    : effectEntries.join(", ");
}

function getRecipeRequirementSummary(
  player: Player,
  recipe: CraftingRecipe,
  context: CraftingContext,
): string[] {
  const inventoryCounts = getInventoryCounts(player.inventory);
  const bottleneckAttempt = getCraftingBottleneckAttempt(player, recipe, context);
  const bottleneckSkillIds = new Set(bottleneckAttempt?.skillIds ?? []);
  const missingIngredients = Object.entries(recipe.ingredients)
    .filter(([itemId, requiredCount]) => (inventoryCounts[itemId] ?? 0) < requiredCount)
    .map(([itemId, requiredCount]) => {
      const itemName = itemData.find((item) => item.id === itemId)?.name ?? itemId;

      return `${itemName} ${requiredCount} (${inventoryCounts[itemId] ?? 0})`;
    });
  const missingSkills = Object.entries(recipe.requiresSkills ?? {})
    .filter(
      ([skillId, requiredRank]) =>
        !bottleneckSkillIds.has(skillId) &&
        (player.skills[skillId] ?? 0) < requiredRank,
    )
    .map(([skillId, requiredRank]) => {
      const skillName = skillData.find((skill) => skill.id === skillId)?.name ?? skillId;

      return `${skillName} rank ${requiredRank} (${player.skills[skillId] ?? 0})`;
    });
  const missingTools = (recipe.requiresTools ?? [])
    .filter((itemId) => !player.inventory.includes(itemId))
    .map((itemId) => itemData.find((item) => item.id === itemId)?.name ?? itemId);
  const missingFacility =
    recipe.requiredFacility &&
    !hasRequiredFacility(player, recipe.requiredFacility, recipe.requiredFacilityTier, context)
      ? [
          getCraftingFacilityTier(player, recipe.requiredFacility) <
          (recipe.requiredFacilityTier ?? 1)
            ? getCraftingFacilityRequirementLabel(
                recipe.requiredFacility,
                recipe.requiredFacilityTier,
              )
            : getCraftingFacilityLocationHint(recipe.requiredFacility),
        ]
      : [];

  return Array.from(
    new Set([...missingIngredients, ...missingSkills, ...missingTools, ...missingFacility]),
  );
}

function getRecipeIngredientDetails(
  player: Player,
  recipe: CraftingRecipe,
): RecipeIngredientDetail[] {
  const inventoryCounts = getInventoryCounts(player.inventory);

  return Object.entries(recipe.ingredients).map(([itemId, requiredCount]) => {
    const itemName = itemData.find((item) => item.id === itemId)?.name ?? itemId;
    const ownedCount = inventoryCounts[itemId] ?? 0;

    return {
      itemId,
      name: itemName,
      requiredCount,
      ownedCount,
      hasEnough: ownedCount >= requiredCount,
    };
  });
}

function getResultPreviewLines(item?: ItemData): string[] {
  if (!item) {
    return [];
  }

  return [
    item.equipmentEffects ? `Equip effect: ${formatEquipmentEffects(item.equipmentEffects)}` : "",
    formatItemEffects(item.effects, "sentence"),
  ].filter((line) => line.length > 0);
}

function formatCraftingFilterLabel(filter: CraftingFilter): string {
  if (filter.startsWith("Facility:")) {
    const facility = craftingFacilities.find(
      (candidate) => candidate.id === filter.replace("Facility:", ""),
    );

    return facility?.label ?? filter;
  }

  const labels: Record<string, string> = {
    Elixir: "Elixirs",
    Weapon: "Weapons",
    Armor: "Armor",
    Medicine: "Medicine",
    Component: "Components",
  };

  return labels[filter] ?? filter;
}

function getRequiredFacilityTier(recipe: CraftingRecipe): CraftingFacilityTier {
  return recipe.requiredFacilityTier ?? 1;
}

function formatTechniqueEffectSummary(effectsPerLevel: Record<string, number>): string {
  const effectEntries = Object.entries(effectsPerLevel).map(([key, value]) => {
    const statKey = key as keyof Player;
    const label = statRequirementLabels[statKey] ?? formatScoreLabel(key);
    const signedValue = value > 0 ? `+${value}` : `${value}`;

    return `${signedValue} ${label} per mastery`;
  });

  return effectEntries.length > 0 ? effectEntries.join(", ") : "No passive stat gain listed";
}

function getTechniqueBenefitLines(technique: LearnedTechniqueView): string[] {
  const combatLine =
    technique.mastery >= 1
      ? "Combat art available"
      : "Practice to mastery 1 to use in combat";
  const specialLines: Record<string, string[]> = {
    azure_cloud_breathing: [
      "Improves base combat power while known",
      "Rank 5 improves cultivation gains",
    ],
    pine_shadow_step: [
      "Unlocks movement and stealth scene options",
      "Mastery 3 can reveal Void Step",
    ],
    iron_body_method: [
      "Iron Body Stance reduces incoming damage when used",
      "Rank 5 grants passive damage reduction",
    ],
    wind_blade_strike: ["Gains bonus damage from stored Wind essence"],
    void_step: ["Unlocks advanced movement routes and high-scaling combat strikes"],
    thunder_current_strike: ["Gains bonus damage from stored Lightning essence"],
  };

  return [
    combatLine,
    formatTechniqueEffectSummary(technique.effectsPerLevel),
    ...(specialLines[technique.id] ?? []),
  ];
}

function getSkillExpLabel(skill: LearnedSkillView): string {
  return `EXP ${getSkillDisplayedExp(
    skill.rank,
    skill.maxRank,
    skill.practice,
  )}/${getSkillExpRequiredForRank(skill.rank)}`;
}

function getSkillExpPercent(skill: LearnedSkillView): number {
  if (skill.rank >= skill.maxRank) {
    return 100;
  }

  return Math.min(
    100,
    (getSkillDisplayedExp(skill.rank, skill.maxRank, skill.practice) /
      getSkillExpRequiredForRank(skill.rank)) *
      100,
  );
}

function getSkillProgressStatus(skill: LearnedSkillView): string {
  if (skill.rank >= skill.maxRank) {
    return "Max rank";
  }

  if (isSkillAtBottleneck(skill.rank, skill.maxRank, skill.practice)) {
    return "Bottleneck ready";
  }

  return "Training";
}

function getSkillProgressSource(tree: Skill["tree"]): string {
  const sourceByTree: Record<Skill["tree"], string> = {
    "Mortal Foundation": "Improves through chores, sparring basics, hard labor, and daily discipline.",
    "Martial Arts": "Improves through sparring, combat, weapon practice, and instructor correction.",
    "Body Tempering": "Improves through endurance trials, impact training, recovery work, and harsh travel.",
    "Mind And Perception": "Improves through investigation, meditation, reading signs, and studying intent.",
    "Social Bearing": "Improves through negotiation, reputation quests, restraint, and formal sect conduct.",
    Survival: "Improves through scavenging, herb gathering, road work, tracking, and field medicine.",
    Alchemy: "Improves through herb study, medicine preparation, residue control, and refining.",
    Blacksmithing: "Improves through repairs, forge work, salvage sorting, and crafting gear.",
    "Cultivation Foundation": "Improves through breathing discipline, meridian control, and stable circulation.",
    "Azure Cloud Methods": "Improves through sect arts, cloud-step practice, qi sensitivity, and elder guidance.",
  };

  return sourceByTree[tree];
}

function getSkillBottleneckSummary(skill: LearnedSkillView): string {
  if (skill.rank >= skill.maxRank) {
    return "No current bottleneck.";
  }

  if (isSkillAtBottleneck(skill.rank, skill.maxRank, skill.practice)) {
    const chance = getSkillBottleneckSuccessChance(skill.bottleneckFailures);
    const failureText =
      skill.bottleneckFailures > 0
        ? ` ${skill.bottleneckFailures} failed attempt${
            skill.bottleneckFailures === 1 ? "" : "s"
          } already raised the chance.`
        : "";

    return `Ready. Attempt a recipe, trial, or field test one rank higher for a ${chance}% breakthrough chance.${failureText}`;
  }

  return "Fill this rank's EXP, then attempt a higher-tier craft, trial, or field test to break through.";
}

function formatItemTier(tier?: ItemTier): string {
  return tier ? itemTierLabels[tier] : "Untiered";
}

function createCharacterState(name: string, gender: CharacterGender) {
  const initialState = createInitialGameState();

  return {
    ...initialState,
    player: {
      ...initialState.player,
      name,
      gender,
    },
  };
}

function hasCreatedCharacter(player: Player): boolean {
  return player.name.trim().length > 0 && player.name !== "Unnamed Villager";
}

function getSaveOwner(session: ProfileSession | null): string {
  return session?.username?.trim() ? session.username : "guest";
}

function getDiscoveryRewardLines(messages: string[]): string[] {
  return messages
    .filter((message) => !message.startsWith("Time advanced to "))
    .map((message) => message.replace(/^Character gained /, "+"))
    .map((message) => message.replace(/^Character learned /, "Learned "))
    .map((message) => message.replace(/^Quest completed: /, "Quest completed: "))
    .map((message) => message.replace(/\.$/, ""));
}

function App() {
  const [profileSession, setProfileSession] = useState<ProfileSession | null>(
    () => getStoredSession(),
  );
  const saveOwner = getSaveOwner(profileSession);
  const [gameState, setGameState] = useState(
    () => {
      const storedSession = getStoredSession();
      return storedSession
        ? loadLatestGame(getSaveOwner(storedSession)) ?? createInitialGameState()
        : createInitialGameState();
    },
  );
  const [startView, setStartView] = useState<StartView>(() =>
    (() => {
      const storedSession = getStoredSession();
      if (!storedSession) return "auth";

      const savedGame = loadLatestGame(getSaveOwner(storedSession));
      return hasCreatedCharacter(savedGame?.player ?? createInitialGameState().player)
        ? "game"
        : "character";
    })(),
  );
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("Register, log in, or continue as guest.");
  const [characterName, setCharacterName] = useState("");
  const [characterGender, setCharacterGender] = useState<CharacterGender>("male");
  const [characterMessage, setCharacterMessage] = useState("Name the person the story will remember.");
  const [saveMessage, setSaveMessage] = useState(
    hasAnySavedGame(getSaveOwner(getStoredSession()))
      ? "Loaded the most recent saved path."
      : "No saved path yet.",
  );
  const [saveSlots, setSaveSlots] = useState(() => getSaveSlots(getSaveOwner(getStoredSession())));
  const [cultivationMessage, setCultivationMessage] = useState(
    "Cultivate after learning a breathing method.",
  );
  const [actionMessages, setActionMessages] = useState<string[]>([]);
  const [rightTab, setRightTab] = useState<RightPanelTab>("stats");
  const [showFullStats, setShowFullStats] = useState(false);
  const [activePackTab, setActivePackTab] = useState<PackTab>("inventory");
  const [activePathTab, setActivePathTab] = useState<PathTab>("quests");
  const [activeInventoryCategory, setActiveInventoryCategory] = useState("All");
  const [activeCraftingFilter, setActiveCraftingFilter] = useState<CraftingFilter>("All");
  const [activeTechniqueCategory, setActiveTechniqueCategory] = useState("All");
  const [activeSkillTree, setActiveSkillTree] = useState("All");
  const [delayedChoice, setDelayedChoice] = useState<DelayedChoiceState | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [breakthroughResult, setBreakthroughResult] =
    useState<BreakthroughResultView | null>(null);
  const [skillBreakthroughResult, setSkillBreakthroughResult] =
    useState<SkillBreakthroughResultView | null>(null);
  const currentScene = useMemo(
    () => getSceneById(sceneData, gameState.currentSceneId),
    [gameState.currentSceneId],
  );
  const currentArea = useMemo(
    () =>
      getSceneAreaById(
        sceneAreaData,
        currentScene.areaId ?? getFallbackSceneAreaId(currentScene.id),
      ),
    [currentScene],
  );
  const currentSceneImage = useMemo(
    () => getResolvedSceneImage(currentScene, currentArea),
    [currentArea, currentScene],
  );
  const currentLocationTitle = currentArea?.name ?? getSceneLocationTitle(currentScene.id);
  const craftingContext = useMemo<CraftingContext>(
    () => ({ sceneId: gameState.currentSceneId }),
    [gameState.currentSceneId],
  );
  const activeEnemy = useMemo(
    () =>
      gameState.combat
        ? enemyData.find((enemy) => enemy.id === gameState.combat?.enemyId)
        : undefined,
    [gameState.combat],
  );
  const equippedWeapon = useMemo(
    () =>
      gameState.player.equipment.weapon
        ? itemData.find((item) => item.id === gameState.player.equipment.weapon)
        : undefined,
    [gameState.player.equipment.weapon],
  );
  const canFocusQiInCombat =
    gameState.player.realm !== "Mortal" || gameState.player.stage !== "Early";
  const foundationOutlook = useMemo(
    () => getFoundationOutlook(gameState.player),
    [gameState.player],
  );
  const ownedItems = useMemo(
    () =>
      gameState.player.inventory.map((itemId) => {
        const item = itemData.find((candidate) => candidate.id === itemId);

        return item ?? { id: itemId, name: `Unknown item: ${itemId}`, effects: {} };
      }),
    [gameState.player.inventory],
  );
  const learnedTechniques = useMemo(
    () =>
      gameState.player.techniques.map((techniqueId) => {
        const technique = techniques.find((candidate) => candidate.id === techniqueId);

        return {
          id: techniqueId,
          name: technique?.name ?? `Unknown technique: ${techniqueId}`,
          category: technique?.category ?? "General",
          description: technique?.description ?? "",
          icon: technique?.icon,
          realmRequirement: technique?.realmRequirement,
          maxLevel: technique?.maxLevel ?? 1,
          mastery: gameState.player.techniqueMastery[techniqueId] ?? 0,
          effectsPerLevel: technique?.effectsPerLevel ?? {},
        };
      }) satisfies LearnedTechniqueView[],
    [gameState.player.techniqueMastery, gameState.player.techniques],
  );
  const learnedSkills = useMemo(
    () =>
      Object.entries(gameState.player.skills)
      .map(([skillId, rank]) => {
        const skill = skillData.find((candidate) => candidate.id === skillId);

        return skill && rank > 0
          ? {
              ...skill,
              rank,
              practice: gameState.player.skillPractice[skillId] ?? 0,
              bottleneckFailures: gameState.player.skillBottleneckFailures[skillId] ?? 0,
            }
          : null;
      })
      .filter((skill) => skill !== null)
      .sort((firstSkill, secondSkill) => firstSkill.tier - secondSkill.tier) satisfies LearnedSkillView[],
    [
      gameState.player.skillBottleneckFailures,
      gameState.player.skillPractice,
      gameState.player.skills,
    ],
  );
  const awakenedConstitutions = useMemo(
    () =>
      gameState.player.constitutions.map((constitutionId) => {
        const constitution = constitutionData.find(
          (candidate) => candidate.id === constitutionId,
        );

        return constitution ?? {
          id: constitutionId,
          name: `Unknown constitution: ${constitutionId}`,
          description: "",
          requiredElements: {},
        };
      }),
    [gameState.player.constitutions],
  );
  const storedElements = useMemo(
    () =>
      Object.entries(gameState.player.elementalEssence)
        .filter(([, amount]) => amount > 0)
        .sort(([firstElement], [secondElement]) =>
          firstElement.localeCompare(secondElement),
        ) as Array<[ElementalEssence, number]>,
    [gameState.player.elementalEssence],
  );
  const relationshipEntries = useMemo(
    () => getScoreEntries(gameState.player.relationships),
    [gameState.player.relationships],
  );
  const reputationEntries = useMemo(
    () => getScoreEntries(gameState.player.reputation),
    [gameState.player.reputation],
  );
  const moralityEntries = useMemo(
    () => getScoreEntries(gameState.player.morality),
    [gameState.player.morality],
  );
  const sectContributionEntries = useMemo(
    () => getScoreEntries(gameState.player.sectContribution),
    [gameState.player.sectContribution],
  );
  const trackedQuests = useMemo(
    () =>
      Object.entries(gameState.player.quests)
        .map(([questId, playerQuest]) => {
          const quest = questData.find((candidate) => candidate.id === questId);

          return quest ? { ...quest, playerQuest } : null;
        })
        .filter((quest) => quest !== null),
    [gameState.player.quests],
  );
  const equippedItems = useMemo(
    () =>
      Object.entries(gameState.player.equipment).map(([slot, itemId]) => {
        const item = itemData.find((candidate) => candidate.id === itemId);

        return {
          slot: slot as EquipmentSlot,
          item,
        };
      }),
    [gameState.player.equipment],
  );
  const inventoryCategories = useMemo(
    () => [
      "All",
      "Equipped",
      ...Array.from(new Set(ownedItems.map((item) => item.category ?? "Misc"))).sort(),
    ],
    [ownedItems],
  );
  const visibleInventoryItems = useMemo(
    () =>
      activeInventoryCategory === "All"
        ? ownedItems
        : ownedItems.filter(
            (item) => (item.category ?? "Misc") === activeInventoryCategory,
          ),
    [activeInventoryCategory, ownedItems],
  );
  const techniqueCategories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(learnedTechniques.map((technique) => technique.category))).sort(),
    ],
    [learnedTechniques],
  );
  const visibleTechniques = useMemo(
    () =>
      activeTechniqueCategory === "All"
        ? learnedTechniques
        : learnedTechniques.filter(
            (technique) => technique.category === activeTechniqueCategory,
          ),
    [activeTechniqueCategory, learnedTechniques],
  );
  const skillTrees = useMemo(
    () => ["All", ...Array.from(new Set(learnedSkills.map((skill) => skill.tree))).sort()],
    [learnedSkills],
  );
  const visibleSkills = useMemo(
    () =>
      activeSkillTree === "All"
        ? learnedSkills
        : learnedSkills.filter((skill) => skill.tree === activeSkillTree),
    [activeSkillTree, learnedSkills],
  );
  const availableRecipes = useMemo(
    () =>
      recipeData
        .filter((recipe) => (gameState.player.knownRecipes ?? []).includes(recipe.id))
        .map((recipe) => ({
          recipe,
          canCraft: canCraftRecipe(gameState.player, recipe, craftingContext),
          bottleneckAttempt: getCraftingBottleneckAttempt(
            gameState.player,
            recipe,
            craftingContext,
          ),
          ingredientDetails: getRecipeIngredientDetails(gameState.player, recipe),
          missingRequirements: getRecipeRequirementSummary(
            gameState.player,
            recipe,
            craftingContext,
          ),
          resultItem: itemData.find((item) => item.id === recipe.resultItem),
        })),
    [craftingContext, gameState.player],
  );
  const craftingFacilityStatuses = useMemo(
    () =>
      craftingFacilities.map((facility) => {
        const currentTier = getCraftingFacilityTier(gameState.player, facility.id);
        const nextTier = Math.min(currentTier + 1, 3) as CraftingFacilityTier;

        return {
          ...facility,
          currentTier,
          hint: getCraftingFacilityUnlockHint(facility.id, nextTier),
          locationHint: getCraftingFacilityLocationHint(facility.id),
          isAvailable: currentTier > 0,
          isHere: hasCraftingFacilityLocation(
            gameState.player,
            facility.id,
            craftingContext,
          ),
        };
      }),
    [craftingContext, gameState.player],
  );
  const craftingFilters = useMemo<CraftingFilter[]>(
    () => [
      "All",
      "Craftable",
      "Locked Requirements",
      ...craftingFacilities.map((facility) => `Facility:${facility.id}`),
      ...Array.from(new Set(availableRecipes.map(({ recipe }) => recipe.category))).sort(),
    ],
    [availableRecipes],
  );
  const visibleRecipes = useMemo(
    () =>
      availableRecipes.filter(({ recipe, canCraft, bottleneckAttempt, missingRequirements }) => {
        if (activeCraftingFilter === "All") {
          return true;
        }

        if (activeCraftingFilter === "Craftable") {
          return canCraft || bottleneckAttempt !== null;
        }

        if (activeCraftingFilter === "Locked Requirements") {
          return !canCraft && bottleneckAttempt === null && missingRequirements.length > 0;
        }

        if (activeCraftingFilter.startsWith("Facility:")) {
          return recipe.requiredFacility === activeCraftingFilter.replace("Facility:", "");
        }

        return recipe.category === activeCraftingFilter;
      }),
    [activeCraftingFilter, availableRecipes],
  );
  const npcJournalEntries = useMemo(
    () =>
      Object.entries(gameState.player.npcJournal)
        .map(([npcId, journalEntry]) => {
          const npc = npcData.find((candidate) => candidate.id === npcId);

          return npc && journalEntry.met ? { npc, journalEntry } : null;
        })
        .filter((entry) => entry !== null)
        .sort((firstEntry, secondEntry) =>
          firstEntry.npc.name.localeCompare(secondEntry.npc.name),
        ),
    [gameState.player.npcJournal],
  );
  const mountainGateLabel = hasLearnedAboutMountainGate(gameState.player)
    ? gameState.player.daysRemainingToExam > 0
      ? `${gameState.player.daysRemainingToExam} days to exam`
      : "Exam day"
    : "Ordinary morning";
  const sectLabel =
    gameState.player.reputation["Azure Cloud Sect"] > 0 ||
    gameState.player.flags.accepted_outer_disciple_after_exam
      ? "Azure Clouds"
      : "Unaffiliated";

  useEffect(() => {
    const theme = sectLabel === "Azure Clouds" ? "theme-azure" : "";
    document.body.className = theme;
  }, [sectLabel]);

  const quickTechniqueSlots = learnedTechniques.slice(0, 4);
  const quickSkillSlots = visibleSkills.slice(0, 2);
  const checkResultMessages = actionMessages.filter(isCheckResultMessage);
  const regularActionMessages = actionMessages.filter(
    (message) => !isCheckResultMessage(message),
  );
  const isBreakthroughDelay = delayedChoice?.choice.effects?.breakthrough !== undefined;

  useEffect(() => {
    if (!delayedChoice) {
      return undefined;
    }

    const seconds = delayedChoice.choice.delay?.seconds ?? 3;
    const duration = seconds * 1000;
    const startedAt = Date.now();
    const stageCount = Math.max(delayedChoice.choice.delay?.stages.length ?? 1, 1);
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const stageIndex = Math.min(Math.floor(progress * stageCount), stageCount - 1);

      setDelayedChoice((current) =>
        current
          ? {
              ...current,
              progress,
              stageIndex,
            }
          : current,
      );
    }, 100);
    const timeoutId = window.setTimeout(() => {
      resolveChoice(delayedChoice.choice, true);
      setDelayedChoice(null);
    }, duration);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [delayedChoice?.choice]);

  function enterSession(session: ProfileSession, message: string) {
    const owner = getSaveOwner(session);
    const savedGame = loadLatestGame(owner);
    const nextGameState = savedGame ?? createInitialGameState();

    setProfileSession(session);
    setGameState(nextGameState);
    setActionMessages([]);
    setDelayedChoice(null);
    setDiscoveryResult(null);
    setBreakthroughResult(null);
    setSaveSlots(getSaveSlots(owner));
    setAuthMessage(message);
    setSaveMessage(
      savedGame
        ? `Loaded ${session.username}'s most recent saved path.`
        : `No saved path for ${session.username} yet.`,
    );
    setStartView(hasCreatedCharacter(nextGameState.player) ? "game" : "character");
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result =
      authMode === "register"
        ? registerProfile(authUsername, authPassword)
        : loginProfile(authUsername, authPassword);

    if (!result.session) {
      setAuthMessage(result.message);
      return;
    }

    setAuthPassword("");
    enterSession(result.session, result.message);
  }

  function handleGuestLogin() {
    enterSession(continueAsGuest(), "Continuing as guest.");
  }

  function handleCreateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = characterName.trim();

    if (trimmedName.length < 2) {
      setCharacterMessage("Enter a character name with at least 2 characters.");
      return;
    }

    const nextGameState = createCharacterState(trimmedName, characterGender);

    saveGame(saveOwner, 1, nextGameState);
    setGameState(nextGameState);
    setActionMessages([]);
    setDelayedChoice(null);
    setDiscoveryResult(null);
    setBreakthroughResult(null);
    setSaveSlots(getSaveSlots(saveOwner));
    setSaveMessage("Character created and saved to slot 1.");
    setCultivationMessage("Cultivate after learning a breathing method.");
    setStartView("game");
  }

  function handleLogout() {
    clearStoredSession();
    setProfileSession(null);
    setStartView("auth");
    setAuthMessage("Logged out on this device.");
  }

  function handleChoice(choice: Choice) {
    if (choice.delay) {
      setDelayedChoice({ choice, progress: 0, stageIndex: 0 });
      setDiscoveryResult(null);
      setBreakthroughResult(null);
      setActionMessages([]);
      return;
    }

    resolveChoice(choice, false);
  }

  function resolveChoice(choice: Choice, showDiscovery: boolean) {
    const result = applyChoiceWithResult(gameState, choice);
    const nextBreakthroughResult = getBreakthroughResultView(
      gameState.player,
      result.gameState.player,
    );
    const discoveryRewards = getDiscoveryRewardLines(result.messages);
    const shouldShowDiscovery =
      showDiscovery &&
      choice.delay &&
      !nextBreakthroughResult &&
      (discoveryRewards.length > 0 ||
        choice.delay.resultTitle !== undefined ||
        choice.delay.resultBody !== undefined);

    setGameState(result.gameState);
    setActionMessages(shouldShowDiscovery || nextBreakthroughResult ? [] : result.messages);
    setBreakthroughResult(nextBreakthroughResult);
    setDiscoveryResult(
      shouldShowDiscovery
        ? {
            title: choice.delay?.resultTitle ?? "Discovery",
            body: choice.delay?.resultBody ?? "Your search turns up something worth remembering.",
            rewards: discoveryRewards,
          }
        : null,
    );
    setSaveMessage("Unsaved changes.");
  }

  function handleDiscoveryContinue() {
    setDiscoveryResult(null);
  }

  function handleBreakthroughContinue() {
    setBreakthroughResult(null);
  }

  function handleRestart() {
    setGameState(createCharacterState(gameState.player.name, gameState.player.gender));
    setActionMessages([]);
    setDelayedChoice(null);
    setDiscoveryResult(null);
    setBreakthroughResult(null);
    setSaveMessage("Started a new path. Save it into a slot when ready.");
    setCultivationMessage("Cultivate after learning a breathing method.");
  }

  function handleManualSave(slot: SaveSlot) {
    saveGame(saveOwner, slot, gameState);
    setSaveSlots(getSaveSlots(saveOwner));
    setSaveMessage(`Saved to slot ${slot}.`);
  }

  function handleLoad(slot: SaveSlot) {
    const savedGame = loadGame(saveOwner, slot);

    if (savedGame) {
      setGameState(savedGame);
      setActionMessages([]);
      setDelayedChoice(null);
      setDiscoveryResult(null);
      setBreakthroughResult(null);
      setSaveMessage("Loaded saved path.");
      return;
    }

    setSaveMessage(`Slot ${slot} is empty.`);
  }

  function handleClearSave(slot: SaveSlot) {
    clearSavedGame(saveOwner, slot);
    setSaveSlots(getSaveSlots(saveOwner));
    setSaveMessage(`Cleared slot ${slot}.`);
  }

  function handleCultivate() {
    const result = cultivate(gameState);
    const nextBreakthroughResult = getBreakthroughResultView(
      gameState.player,
      result.gameState.player,
    );

    setGameState(result.gameState);
    setActionMessages(
      nextBreakthroughResult
        ? []
        : getPlayerChangeMessages(gameState.player, result.gameState.player),
    );
    setBreakthroughResult(nextBreakthroughResult);
    setCultivationMessage(result.message);
    setSaveMessage("Unsaved changes.");
  }

  function handleUseItem(item: ItemData) {
    const result = useItem(gameState, item);

    setGameState(result.gameState);
    setActionMessages([
      ...getPlayerChangeMessages(gameState.player, result.gameState.player),
      result.message,
    ]);
    setCultivationMessage(result.message);
    setSaveMessage("Unsaved changes.");
  }

  function handleCraftRecipe(recipe: CraftingRecipe) {
    const bottleneckAttempt = getCraftingBottleneckAttempt(
      gameState.player,
      recipe,
      craftingContext,
    );
    const result = bottleneckAttempt
      ? attemptCraftingBottleneck(gameState, recipe, craftingContext)
      : craftRecipe(gameState, recipe, craftingContext);

    setGameState(result.gameState);
    setActionMessages([
      ...getPlayerChangeMessages(gameState.player, result.gameState.player),
      result.message,
    ]);
    setSkillBreakthroughResult(
      result.skillBreakthrough
        ? getSkillBreakthroughResultView(recipe, result.skillBreakthrough)
        : null,
    );
    setSaveMessage("Unsaved changes.");
  }

  function handleSkillBreakthroughContinue() {
    setSkillBreakthroughResult(null);
  }

  function handleEquipItem(item: ItemData) {
    const result = equipItem(gameState, item);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Unsaved changes.");
  }

  function handleUnequipItem(slot: EquipmentSlot) {
    const result = unequipItem(gameState, slot);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Unsaved changes.");
  }

  function handleCombatContinue() {
    if (!gameState.combat?.resolved) return;
    setGameState(continueCombat(gameState));
    setActionMessages([]);
  }

  function handlePostCombatChoice(choiceId: PostCombatChoiceId) {
    if (!activeEnemy) return;
    const nextState = resolvePostCombatChoice(gameState, activeEnemy, choiceId);
    setGameState(nextState);
    setActionMessages([]);
    setSaveMessage("Unsaved changes.");
  }

  function handleCombatAction(action: CombatAction, techniqueId?: string) {
    if (!activeEnemy) {
      return;
    }

    const nextGameState = resolveCombatAction(gameState, activeEnemy, action, techniqueId);

    setGameState(nextGameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, nextGameState.player));
    setSaveMessage("Unsaved changes.");
  }

  if (startView === "auth") {
    return (
      <main className="start-shell">
        <section className="start-panel">
          <p className="eyebrow">Textbased Xianxia</p>
          <h1>Enter The Story</h1>
          <div className="auth-mode-tabs" role="tablist" aria-label="Account mode">
            <button
              type="button"
              aria-selected={authMode === "login"}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              aria-selected={authMode === "register"}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>
          <form className="start-form" onSubmit={handleAuthSubmit}>
            <label>
              Username
              <input
                value={authUsername}
                onChange={(event) => setAuthUsername(event.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />
            </label>
            <button type="submit">
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
          <button className="guest-button" type="button" onClick={handleGuestLogin}>
            Continue As Guest
          </button>
          <p className="start-message">{authMessage}</p>
        </section>
      </main>
    );
  }

  if (startView === "character") {
    return (
      <main className="start-shell">
        <section className="start-panel">
          <p className="eyebrow">
            {profileSession?.mode === "guest" ? "Guest Path" : profileSession?.username}
          </p>
          <h1>Create Character</h1>
          <form className="start-form" onSubmit={handleCreateCharacter}>
            <label>
              Character Name
              <input
                value={characterName}
                onChange={(event) => setCharacterName(event.target.value)}
                placeholder="Village name"
              />
            </label>
            <fieldset className="gender-options">
              <legend>Gender</legend>
              <label>
                <input
                  checked={characterGender === "male"}
                  name="character-gender"
                  onChange={() => setCharacterGender("male")}
                  type="radio"
                />
                Male
              </label>
              <label>
                <input
                  checked={characterGender === "female"}
                  name="character-gender"
                  onChange={() => setCharacterGender("female")}
                  type="radio"
                />
                Female
              </label>
            </fieldset>
            <button type="submit">Begin</button>
          </form>
          <button className="guest-button" type="button" onClick={handleLogout}>
            Back To Login
          </button>
          <p className="start-message">{characterMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-status-bar" aria-label="Journey status">
        <span>Name: {gameState.player.name}</span>
        <span>Sect: {sectLabel}</span>
        <span>
          Realm: {getRealmDisplay(gameState.player)}
        </span>
        <span>Spirit Stones: {gameState.player.spiritStones}</span>
        <span>{mountainGateLabel}</span>
      </header>

      <section className="story-panel">
        <h1>{currentLocationTitle}</h1>
        {checkResultMessages.length > 0 ? (
          <ul className="action-messages" aria-live="polite">
            {checkResultMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
        <h2 className="scene-title">{currentScene.title}</h2>
        {currentScene.status ? (
          <div className="scene-status" aria-label={currentScene.status.label}>
            <div>
              <strong>{currentScene.status.label}</strong>
              <span>
                {currentScene.status.value}/{currentScene.status.max}
              </span>
            </div>
            <div className="scene-status-meter">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    (currentScene.status.value / currentScene.status.max) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : null}
        <p className="scene-body">{currentScene.body}</p>
        {regularActionMessages.length > 0 ? (
          <ul className="action-messages" aria-live="polite">
            {regularActionMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="scene-window-panel" aria-label="Scene art">
        {discoveryResult ? (
          <div className="victory-screen discovery-screen">
            <div className="victory-corner victory-corner-tl" aria-hidden="true" />
            <div className="victory-corner victory-corner-tr" aria-hidden="true" />
            <div className="victory-corner victory-corner-bl" aria-hidden="true" />
            <div className="victory-corner victory-corner-br" aria-hidden="true" />
            <div className="victory-content">
              <h2 className="victory-heading">{discoveryResult.title}</h2>
              <p className="victory-flavor">{discoveryResult.body}</p>
              {discoveryResult.rewards.length > 0 ? (
                <div className="victory-spoils-wrap">
                  <h3 className="ornate-panel-title">Found</h3>
                  <div className="victory-rewards-panel">
                    {discoveryResult.rewards.map((reward) => (
                      <div key={reward} className="victory-reward-row">
                        <span className="victory-reward-icon">◆</span>
                        <span>{reward}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <button className="victory-continue-btn" type="button" onClick={handleDiscoveryContinue}>
                Continue
              </button>
            </div>
          </div>
        ) : delayedChoice ? (
          <div
            className={
              isBreakthroughDelay
                ? "breakthrough-attempt-panel"
                : "search-resolution-panel"
            }
            aria-live="polite"
          >
            {isBreakthroughDelay ? (
              <img
                src={breakthroughImagePath}
                alt=""
                className="breakthrough-attempt-image"
                aria-hidden="true"
              />
            ) : null}
            {isBreakthroughDelay ? (
              <div className="breakthrough-attempt-shade" aria-hidden="true" />
            ) : null}
            <div className={isBreakthroughDelay ? "breakthrough-attempt-content" : undefined}>
            <p className="eyebrow">{isBreakthroughDelay ? "Attempting Breakthrough" : "Searching"}</p>
            <h2>{delayedChoice.choice.label}</h2>
            <p>
              {delayedChoice.choice.delay?.stages[delayedChoice.stageIndex] ??
                (isBreakthroughDelay ? "The bottleneck begins to move." : "Looking carefully...")}
            </p>
            <div
              className={isBreakthroughDelay ? "breakthrough-attempt-track" : "search-progress-track"}
              aria-label={isBreakthroughDelay ? "Breakthrough progress" : "Search progress"}
            >
              <span style={{ width: `${Math.round(delayedChoice.progress * 100)}%` }} />
            </div>
            </div>
          </div>
        ) : gameState.combat?.resolved && activeEnemy ? (
          <div className="victory-screen">
            <div className="victory-corner victory-corner-tl" aria-hidden="true" />
            <div className="victory-corner victory-corner-tr" aria-hidden="true" />
            <div className="victory-corner victory-corner-bl" aria-hidden="true" />
            <div className="victory-corner victory-corner-br" aria-hidden="true" />
            <div className="victory-content">
              {gameState.combat.postCombat?.stage === "choosing" ? (
                <>
                  <h2 className="victory-heading">Victory</h2>
                  {gameState.combat.reflection && (
                    <p className="victory-flavor">{gameState.combat.reflection}</p>
                  )}
                  <div className="post-combat-choices">
                    <h3 className="ornate-panel-title">What do you do?</h3>
                    <ul className="post-combat-choice-list">
                      {getPostCombatChoices(gameState.player, activeEnemy).map((choice) => (
                        <li key={choice.id}>
                          <button
                            type="button"
                            className={`post-combat-choice-btn alignment-${choice.alignment}${!choice.available ? " choice-locked" : ""}`}
                            onClick={() => handlePostCombatChoice(choice.id)}
                            disabled={!choice.available}
                          >
                            <span className="post-combat-choice-label">{choice.label}</span>
                            <span className="post-combat-choice-desc">{choice.description}</span>
                            {choice.requiresNote && (
                              <span className="post-combat-choice-req">{choice.requiresNote}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="victory-heading">Victory</h2>
                  {gameState.combat.postCombat?.messages.map((msg, i) => (
                    <p key={i} className="victory-flavor">{msg}</p>
                  ))}
                  {(gameState.combat.rewards?.spiritStones ?? 0) > 0 ||
                   (gameState.combat.rewards?.items?.length ?? 0) > 0 ||
                   (gameState.combat.rewards?.qi ?? 0) > 0 ? (
                    <div className="victory-spoils-wrap">
                      <h3 className="ornate-panel-title">Gained</h3>
                      <div className="victory-rewards-panel">
                        {(gameState.combat.rewards?.spiritStones ?? 0) > 0 && (
                          <div className="victory-reward-row">
                            <span className="victory-reward-icon">◈</span>
                            <span>+{gameState.combat.rewards!.spiritStones} Spirit Stones</span>
                          </div>
                        )}
                        {gameState.combat.rewards?.items.map((itemId) => {
                          const item = itemData.find((i) => i.id === itemId);
                          return item ? (
                            <div key={itemId} className="victory-reward-row">
                              <span className="victory-reward-icon">◆</span>
                              <span>× 1 {item.name}</span>
                            </div>
                          ) : null;
                        })}
                        {(gameState.combat.rewards?.qi ?? 0) > 0 && (
                          <div className="victory-reward-row">
                            <span className="victory-reward-icon">◎</span>
                            <span>+{gameState.combat.rewards!.qi} Cultivation Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <button className="victory-continue-btn" type="button" onClick={handleCombatContinue}>
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        ) : currentScene.type === "questBoard" ? (
          <QuestBoardScene
            scene={currentScene}
            gameState={gameState}
            onChoice={handleChoice}
          />
        ) : (
          <>
            {currentSceneImage ? (
              <figure className="scene-image-frame">
                <img src={currentSceneImage.src} alt={currentSceneImage.alt} />
                {currentSceneImage.caption ? (
                  <figcaption>{currentSceneImage.caption}</figcaption>
                ) : null}
              </figure>
            ) : (
              <div className="scene-image-placeholder">
                <span>{currentLocationTitle}</span>
                <strong>{currentScene.title}</strong>
              </div>
            )}
            {gameState.combat && activeEnemy ? (
          <div className="combat-panel">
            <div>
              <p className="eyebrow">Combat</p>
              <h2>{activeEnemy.name}</h2>
              {activeEnemy.image ? (
                <figure className="combat-enemy-image">
                  <img src={activeEnemy.image.src} alt={activeEnemy.image.alt} />
                </figure>
              ) : null}
              {"cultivation" in activeEnemy && activeEnemy.cultivation ? (
                <p className="combat-cultivation">
                  {activeEnemy.cultivation.realm} · {activeEnemy.cultivation.stage}
                </p>
              ) : null}
              <p>{activeEnemy.description}</p>
              <div className="enemy-meter" aria-label="Enemy health">
                <span
                  style={{
                    width: `${
                      (gameState.combat.enemyHealth / activeEnemy.maxHealth) * 100
                    }%`,
                  }}
                />
              </div>
              <p>
                {gameState.combat.enemyHealth}/{activeEnemy.maxHealth} health
              </p>
            </div>
            {!gameState.combat.resolved ? (
              <div className="choices combat-actions">
                <button type="button" onClick={() => handleCombatAction("strike")}>
                  Strike with bare hands
                </button>
                {equippedWeapon ? (
                  <button type="button" onClick={() => handleCombatAction("weapon")}>
                    Strike with {equippedWeapon.name}
                  </button>
                ) : null}
                {canFocusQiInCombat ? (
                  <button
                    type="button"
                    onClick={() => handleCombatAction("focus")}
                    disabled={gameState.player.qi < 2}
                  >
                    Focus qi into your strike
                  </button>
                ) : null}
                {getAvailableTechniqueActions(gameState.player).map((t) => (
                  <button
                    key={t.techniqueId}
                    type="button"
                    onClick={() => handleCombatAction("technique", t.techniqueId)}
                    disabled={gameState.player.qi < t.qiCost}
                  >
                    {t.name} <small>(rank {t.mastery} · {t.qiCost} qi)</small>
                  </button>
                ))}
                <button type="button" onClick={() => handleCombatAction("flee")}>
                  Retreat
                </button>
              </div>
            ) : null}
            <ul className="combat-log">
              {gameState.combat.log.map((entry, i) => (
                <li key={i} className={`combat-log-entry combat-log-${entry.type}`}>
                  {entry.turn > 0 && (
                    <span className="combat-log-turn">T{entry.turn}</span>
                  )}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: entry.text.replace(
                        /\b(\d+)\s+damage\b/g,
                        (_, n) =>
                          `<mark class="dmg-${entry.type === "player" ? "dealt" : "taken"}">${n}</mark> damage`,
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="choices">
            {currentScene.choices.length > 0 ? (
              currentScene.choices.map((choice) => {
                const isAvailable = canChoose(gameState, choice);
                if (choice.hidden && !isAvailable) return null;
                const requirementSummary = getChoiceRequirementSummary(
                  gameState.player,
                  choice,
                );
                const checkSummary = getChoiceCheckSummary(choice);

                return (
                  <div
                    className={`choice-option${isAvailable ? "" : " choice-option-locked"}`}
                    key={choice.label}
                  >
                    <button
                      type="button"
                      onClick={() => handleChoice(choice)}
                      disabled={!isAvailable}
                    >
                      <span>{choice.label}</span>
                      {checkSummary.length > 0 ? (
                        <small>{checkSummary.join(", ")}</small>
                      ) : null}
                    </button>
                    {!isAvailable && requirementSummary.length > 0 ? (
                      <p>Requires {requirementSummary.join(", ")}</p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <button type="button" onClick={handleRestart}>
                Begin again
              </button>
            )}
          </div>
        )}
          </>
        )}
      </section>

      <aside className="character-sheet-panel" aria-label="Character">
        {rightTab === "stats" ? (
          <>
            <h2 className="ornate-panel-title">Character Stats</h2>
            <div className="character-identity-card">
              <div className="portrait-frame" aria-label="Character portrait">
                {gameState.player.gender === "male" ? (
                  <img
                    src="/assets/characters/Male_character.png"
                    alt={gameState.player.name}
                    className="portrait-image"
                  />
                ) : (
                  <span>{gameState.player.name.slice(0, 1).toUpperCase()}</span>
                )}
                <small>{gameState.player.gender === "female" ? "Female" : "Male"}</small>
              </div>
              <div className="vital-stack">
                <div className="vital-row">
                  <span>Health</span>
                  <strong>
                    {gameState.player.health}/{gameState.player.maxHealth}
                  </strong>
                </div>
                <div className="status-meter health-meter">
                  <span
                    style={{
                      width: `${
                        (gameState.player.health / gameState.player.maxHealth) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className="vital-row">
                  <span>Time</span>
                  <strong>{formatCalendarTime(gameState.player)}</strong>
                </div>
                <div className="vital-row">
                  <span>Spirit Qi</span>
                  <strong>
                    {gameState.player.qi}/{gameState.player.maxQi}
                  </strong>
                </div>
                <div className="status-meter qi-meter">
                  <span
                    style={{
                      width: `${(gameState.player.qi / gameState.player.maxQi) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <section className="cultivation-snapshot">
              <div className="vital-row">
                <span>Cultivation Progress</span>
                <strong>
                  {gameState.player.qi}/{gameState.player.maxQi}
                </strong>
              </div>
              <div className="status-meter progress-meter">
                <span
                  style={{
                    width: `${(gameState.player.qi / gameState.player.maxQi) * 100}%`,
                  }}
                />
              </div>
              <div className="foundation-outlook-card">
                <div className="foundation-outlook-header">
                  <span>Breakthrough Outlook</span>
                  <strong>{foundationOutlook.title}</strong>
                </div>
                <p>{foundationOutlook.body}</p>
                <div className="foundation-outlook-grid">
                  <div>
                    <span>Helpful Signs</span>
                    <ul>
                      {(foundationOutlook.helpfulSigns.length > 0
                        ? foundationOutlook.helpfulSigns
                        : ["No clear advantages yet."]
                      ).map((sign) => (
                        <li key={sign}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span>Risks</span>
                    <ul>
                      {(foundationOutlook.risks.length > 0
                        ? foundationOutlook.risks
                        : ["No major risks showing."]
                      ).map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="cultivation-controls">
                <button type="button" onClick={handleCultivate}>
                  Cultivate
                </button>
              </div>
              <p className="cultivation-message">{cultivationMessage}</p>
            </section>

            <button
              type="button"
              className="stats-toggle-btn"
              onClick={() => setShowFullStats((v) => !v)}
            >
              Stats {showFullStats ? "▲" : "▼"}
            </button>

            {showFullStats && (
              <dl className="hero-stat-list">
                <div>
                  <dt>Strength</dt>
                  <dd>{gameState.player.strength}</dd>
                </div>
                <div>
                  <dt>Endurance</dt>
                  <dd>{gameState.player.endurance}</dd>
                </div>
                <div>
                  <dt>Agility</dt>
                  <dd>{gameState.player.agility}</dd>
                </div>
                <div>
                  <dt>Intelligence</dt>
                  <dd>{gameState.player.intelligence}</dd>
                </div>
                <div>
                  <dt>Perception</dt>
                  <dd>{gameState.player.perception}</dd>
                </div>
                <div>
                  <dt>Spirit Sense</dt>
                  <dd>{gameState.player.spiritualSense}</dd>
                </div>
                <div>
                  <dt>Physique</dt>
                  <dd>{gameState.player.physique}</dd>
                </div>
                <div>
                  <dt>Comprehension</dt>
                  <dd>{gameState.player.comprehension}</dd>
                </div>
                <div>
                  <dt>Willpower</dt>
                  <dd>{gameState.player.willpower}</dd>
                </div>
                <div>
                  <dt>Foundation</dt>
                  <dd>{gameState.player.foundationStability}</dd>
                </div>
                {gameState.player.foundationQuality ? (
                  <div>
                    <dt>Foundation Quality</dt>
                    <dd>{getFoundationQualityLabel(gameState.player.foundationQuality)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Fatigue</dt>
                  <dd>{gameState.player.trainingFatigue}</dd>
                </div>
                <div>
                  <dt>Impurity</dt>
                  <dd>{gameState.player.impurity}</dd>
                </div>
                <div>
                  <dt>Karma</dt>
                  <dd>{gameState.player.karma}</dd>
                </div>
                <div>
                  <dt>Corruption</dt>
                  <dd>{gameState.player.corruption}</dd>
                </div>
              </dl>
            )}

            <section className="quick-ability-section">
              <h2 className="ornate-panel-title compact-title">Skills / Techniques</h2>
              <div className="quick-slot-grid">
                {[...quickTechniqueSlots, ...quickSkillSlots].map((entry) => (
                  <div className="quick-slot filled-slot" key={entry.id} title={entry.description}>
                    <span className="slot-icon">{entry.name.slice(0, 1)}</span>
                    <strong>{entry.name}</strong>
                  </div>
                ))}
                {Array.from({
                  length: Math.max(0, 6 - quickTechniqueSlots.length - quickSkillSlots.length),
                }).map((_, index) => (
                  <div className="quick-slot empty-slot" key={`empty-quick-${index}`}>
                    <span className="slot-icon">+</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="character-panel-actions">
              <button type="button" onClick={() => setRightTab("pack")}>
                Pack
              </button>
              <button type="button" onClick={() => setRightTab("path")}>
                Path
              </button>
              <button type="button" onClick={() => setRightTab("save")}>
                Save
              </button>
            </div>
          </>
        ) : rightTab === "pack" ? (
          <>
            <div className="overlay-panel-header">
              <strong>Pack</strong>
              <button type="button" onClick={() => setRightTab("stats")}>
                ← Stats
              </button>
            </div>
            <section className="collection-tabs" aria-label="Pack">
              <div className="tab-list" role="tablist" aria-label="Pack">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePackTab === "inventory"}
                  aria-controls="inventory-panel"
                  onClick={() => setActivePackTab("inventory")}
                >
                  <Backpack aria-hidden="true" size={16} />
                  <span>Inventory</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePackTab === "crafting"}
                  aria-controls="crafting-panel"
                  onClick={() => setActivePackTab("crafting")}
                >
                  <Workflow aria-hidden="true" size={16} />
                  <span>Crafting</span>
                </button>
              </div>

              {activePackTab === "inventory" ? (
                <div id="inventory-panel" role="tabpanel" className="tab-panel">
                  <h2>Inventory</h2>
                  <div className="slot-board">
                    <div className="slot-grid" aria-label="Inventory slots">
                      {activeInventoryCategory === "Equipped"
                        ? equipmentSlots.map((slot) => {
                            const item = equippedItems.find(
                              (entry) => entry.slot === slot,
                            )?.item;

                            return item ? (
                              <button
                                type="button"
                                className="inventory-slot filled-slot equipped-slot"
                                key={slot}
                                onClick={() => handleUnequipItem(slot)}
                                title={
                                  [
                                    item.name,
                                    formatItemTier(item.tier),
                                    item.description,
                                    item.equipmentEffects
                                      ? formatEquipmentEffects(item.equipmentEffects)
                                      : null,
                                    "Click to unequip.",
                                  ]
                                    .filter((line) => line)
                                    .join("\n")
                                }
                              >
                                {renderSlotIcon(item.icon, item.name)}
                                <strong>{item.name}</strong>
                                <small>{equipmentSlotLabels[slot]}</small>
                              </button>
                            ) : (
                              <div
                                className="inventory-slot empty-slot"
                                key={slot}
                                title={`${equipmentSlotLabels[slot]} slot is empty.`}
                              >
                                <span className="slot-icon">
                                  {equipmentSlotLabels[slot].slice(0, 1)}
                                </span>
                                <small>{equipmentSlotLabels[slot]}</small>
                              </div>
                            );
                          })
                        : visibleInventoryItems.map((item, index) => {
                            const isEquipped =
                              item.equipmentSlot &&
                              gameState.player.equipment[item.equipmentSlot] === item.id;
                            const itemEffectSummary = formatItemEffects(item.effects);
                            const isUsableItem = itemEffectSummary.length > 0;

                            const slotTitle = [
                              item.name,
                              formatItemTier(item.tier),
                              item.description,
                              isUsableItem ? formatItemEffects(item.effects, "sentence") : null,
                              item.equipmentEffects
                                ? formatEquipmentEffects(item.equipmentEffects)
                                : null,
                              item.equipmentSlot
                                ? isEquipped
                                  ? "Equipped. Click to unequip."
                                  : "Click to equip."
                                : isUsableItem
                                  ? "Click to use."
                                : null,
                            ]
                              .filter((line) => line)
                              .join("\n");

                            return item.equipmentSlot ? (
                              <button
                                type="button"
                                className={`inventory-slot filled-slot${isEquipped ? " equipped-slot" : ""}`}
                                key={`${item.id}-${index}`}
                                onClick={() =>
                                  isEquipped
                                    ? handleUnequipItem(item.equipmentSlot as EquipmentSlot)
                                    : handleEquipItem(item)
                                }
                                title={slotTitle}
                              >
                                {renderSlotIcon(item.icon, item.name)}
                                <strong>{item.name}</strong>
                                <small>{formatItemTier(item.tier)}</small>
                                <small>{item.category ?? "Misc"}</small>
                                {item.equipmentEffects ? (
                                  <small>{formatEquipmentEffects(item.equipmentEffects)}</small>
                                ) : null}
                              </button>
                            ) : isUsableItem ? (
                              <button
                                type="button"
                                className="inventory-slot filled-slot"
                                key={`${item.id}-${index}`}
                                onClick={() => handleUseItem(item)}
                                title={slotTitle}
                              >
                                {renderSlotIcon(item.icon, item.name)}
                                <strong>{item.name}</strong>
                                <small>{formatItemTier(item.tier)}</small>
                                <small>{item.category ?? "Misc"}</small>
                                <small>{itemEffectSummary}</small>
                              </button>
                            ) : (
                              <div
                                className="inventory-slot filled-slot"
                                key={`${item.id}-${index}`}
                                title={slotTitle}
                              >
                                {renderSlotIcon(item.icon, item.name)}
                                <strong>{item.name}</strong>
                                <small>{formatItemTier(item.tier)}</small>
                                <small>{item.category ?? "Misc"}</small>
                                {itemEffectSummary ? <small>{itemEffectSummary}</small> : null}
                              </div>
                            );
                          })}
                      {Array.from({
                        length: Math.max(
                          0,
                          12 -
                            (activeInventoryCategory === "Equipped"
                              ? equipmentSlots.length
                              : visibleInventoryItems.length),
                        ),
                      }).map((_, index) => (
                        <div className="inventory-slot empty-slot" key={`empty-item-${index}`}>
                          <span className="slot-icon">+</span>
                        </div>
                      ))}
                    </div>
                    <div className="slot-filter-list" aria-label="Inventory categories">
                      {inventoryCategories.map((category) => (
                        <button
                          type="button"
                          key={category}
                          aria-pressed={activeInventoryCategory === category}
                          onClick={() => setActiveInventoryCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activePackTab === "crafting" ? (
                <div id="crafting-panel" role="tabpanel" className="tab-panel">
                  <h2>Crafting</h2>
                  <div className="crafting-facility-strip" aria-label="Crafting facility access">
                    {craftingFacilityStatuses.map((facility) => (
                      <div
                        key={facility.id}
                        className={
                          facility.isAvailable
                            ? "crafting-facility-card facility-available"
                            : "crafting-facility-card facility-locked"
                        }
                      >
                        <strong>{facility.label}</strong>
                        <span>
                          {facility.currentTier > 0
                            ? `Tier ${facility.currentTier}`
                            : "Locked"}
                        </span>
                        <small>
                          {facility.currentTier >= 3
                            ? facility.isHere
                              ? "Highest current tier available here."
                              : `Unlocked, but not here. ${facility.locationHint}`
                            : facility.currentTier > 0
                              ? facility.isHere
                                ? `Available here. Next: ${facility.hint}`
                                : `Unlocked, but not here. ${facility.locationHint}`
                              : `Unlock: ${facility.hint}`}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div
                    className="slot-filter-list crafting-filter-list"
                    aria-label="Crafting filters"
                  >
                    {craftingFilters.map((filter) => (
                      <button
                        type="button"
                        key={filter}
                        aria-pressed={activeCraftingFilter === filter}
                        onClick={() => setActiveCraftingFilter(filter)}
                      >
                        {formatCraftingFilterLabel(filter)}
                      </button>
                    ))}
                  </div>
                  {visibleRecipes.length > 0 ? (
                    <ul className="crafting-list">
                      {visibleRecipes.map(
                        ({
                          recipe,
                          canCraft,
                          bottleneckAttempt,
                          ingredientDetails,
                          missingRequirements,
                          resultItem,
                        }) => {
                          const resultPreviewLines = getResultPreviewLines(resultItem);
                          const requiredFacilityTier = getRequiredFacilityTier(recipe);
                          const facilityIsAvailable = recipe.requiredFacility
                            ? hasRequiredFacility(
                                gameState.player,
                                recipe.requiredFacility,
                                requiredFacilityTier,
                                craftingContext,
                              )
                            : true;
                          const facilityLabel = recipe.requiredFacility
                            ? getCraftingFacilityRequirementLabel(
                                recipe.requiredFacility,
                                requiredFacilityTier,
                              )
                            : "Hand craft";
                          const facilityHint = recipe.requiredFacility
                            ? getCraftingFacilityUnlockHint(
                                recipe.requiredFacility,
                                requiredFacilityTier,
                              )
                            : "";
                          const requiredToolNames = (recipe.requiresTools ?? []).map(
                            (itemId) => itemData.find((item) => item.id === itemId)?.name ?? itemId,
                          );
                          const canAttemptBreakthrough = bottleneckAttempt !== null;

                          return (
                            <li key={recipe.id}>
                              <div className="crafting-recipe-main">
                                <strong>{recipe.name}</strong>
                              <span>
                                {formatItemTier(recipe.tier)} {recipe.category}
                              </span>
                              {recipe.source ? (
                                <small className="crafting-source">{recipe.source}</small>
                              ) : null}
                              <div
                                className={
                                  facilityIsAvailable
                                    ? "crafting-facility-requirement facility-available"
                                    : "crafting-facility-requirement facility-locked"
                                }
                              >
                                <span>Facility</span>
                                <strong>{facilityLabel}</strong>
                                <small>
                                  {facilityIsAvailable ? "Available" : `Locked: ${facilityHint}`}
                                </small>
                                {requiredToolNames.length > 0 ? (
                                  <small>Tool: {requiredToolNames.join(", ")}</small>
                                ) : null}
                              </div>
                              <p>{recipe.description}</p>

                                {resultItem ? (
                                  <div className="crafting-result-preview">
                                    {renderSlotIcon(resultItem.icon, resultItem.name)}
                                    <div>
                                      <small>
                                        Creates {recipe.quantity} {formatItemTier(resultItem.tier)}{" "}
                                        {resultItem.name}
                                      </small>
                                      {resultPreviewLines.length > 0 ? (
                                        resultPreviewLines.map((line) => (
                                          <small key={line}>{line}</small>
                                        ))
                                      ) : (
                                        <small>{resultItem.category ?? "Crafting component"}</small>
                                      )}
                                    </div>
                                  </div>
                                ) : null}

                                <div className="crafting-ingredients" aria-label="Recipe ingredients">
                                  <span>Ingredients</span>
                                  <ul className="crafting-ingredient-list">
                                    {ingredientDetails.map((ingredient) => (
                                      <li
                                        key={ingredient.itemId}
                                        className={
                                          ingredient.hasEnough
                                            ? "ingredient-owned"
                                            : "ingredient-missing"
                                        }
                                      >
                                        <span>{ingredient.hasEnough ? "Have" : "Need"}</span>
                                        <strong>{ingredient.name}</strong>
                                        <small>
                                          {ingredient.ownedCount}/{ingredient.requiredCount}
                                        </small>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {!canCraft && missingRequirements.length > 0 ? (
                                  <small className="crafting-missing-summary">
                                    Missing {missingRequirements.join(", ")}
                                  </small>
                                ) : null}
                                {bottleneckAttempt ? (
                                  <div className="crafting-bottleneck-note">
                                    <span>Breakthrough Craft</span>
                                    <strong>{bottleneckAttempt.chance}% success chance</strong>
                                    <small>
                                      Success raises {bottleneckAttempt.skillNames.join(", ")}.
                                      Failure preserves materials and improves the next chance.
                                    </small>
                                  </div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                disabled={!canCraft && !canAttemptBreakthrough}
                                onClick={() => handleCraftRecipe(recipe)}
                              >
                                {canAttemptBreakthrough ? "Attempt Breakthrough Craft" : "Craft"}
                              </button>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  ) : (
                    <p className="crafting-empty-state">
                      {availableRecipes.length > 0
                        ? "No recipes match this filter."
                        : "Earn trust with crafters, medicine disciples, and elders to learn more recipes."}
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          </>
        ) : rightTab === "path" ? (
          <>
            <div className="overlay-panel-header">
              <strong>Path</strong>
              <button type="button" onClick={() => setRightTab("stats")}>
                ← Stats
              </button>
            </div>
            <section className="collection-tabs" aria-label="Path">
              <div className="tab-list" role="tablist" aria-label="Path">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePathTab === "quests"}
                  aria-controls="quests-panel"
                  onClick={() => setActivePathTab("quests")}
                >
                  <ListChecks aria-hidden="true" size={16} />
                  <span>Quests</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePathTab === "journal"}
                  aria-controls="journal-panel"
                  onClick={() => setActivePathTab("journal")}
                >
                  <BookOpen aria-hidden="true" size={16} />
                  <span>Journal</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePathTab === "techniques"}
                  onClick={() => setActivePathTab("techniques")}
                >
                  <ScrollText aria-hidden="true" size={16} />
                  <span>Arts</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePathTab === "skills"}
                  onClick={() => setActivePathTab("skills")}
                >
                  <Swords aria-hidden="true" size={16} />
                  <span>Skills</span>
                </button>
              </div>

              {activePathTab === "quests" ? (
                <div id="quests-panel" role="tabpanel" className="tab-panel">
                  <h2>Quests</h2>
                  {trackedQuests.length > 0 ? (
                    <ul className="quest-list">
                      {trackedQuests.map((quest) => (
                        <li key={quest.id}>
                          <strong>{quest.name}</strong>
                          <span>{quest.playerQuest.status}</span>
                          <p>
                            {quest.playerQuest.status === "completed"
                              ? "Completed"
                              : quest.steps[quest.playerQuest.step]}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No active quests</p>
                  )}
                </div>
              ) : null}

              {activePathTab === "journal" ? (
                <div id="journal-panel" role="tabpanel" className="tab-panel">
                  <h2>Journal</h2>
                  {npcJournalEntries.length > 0 ? (
                    <ul className="journal-list">
                      {npcJournalEntries.map(({ npc, journalEntry }) => {
                        const relatedQuests = npc.associatedQuests
                          ?.map((questId) => {
                            const quest = questData.find((candidate) => candidate.id === questId);
                            const playerQuest = gameState.player.quests[questId];

                            return quest
                              ? `${quest.name}: ${playerQuest?.status ?? "not started"}`
                              : null;
                          })
                          .filter((questSummary) => questSummary !== null);

                        return (
                          <li key={npc.id}>
                            <strong>
                              {npc.name}: "{npc.description}"
                            </strong>
                            <span>{npc.title}</span>
                            {journalEntry.conversations.length > 0 ? (
                              <ul>
                                {journalEntry.conversations.map((conversation) => (
                                  <li key={conversation}>{conversation}</li>
                                ))}
                              </ul>
                            ) : null}
                            {relatedQuests && relatedQuests.length > 0 ? (
                              <small>{relatedQuests.join(" | ")}</small>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>No characters recorded yet</p>
                  )}
                </div>
              ) : null}

              {activePathTab === "techniques" ? (
                <div id="techniques-panel" role="tabpanel" className="tab-panel">
                  <h2>Arts</h2>
                  <div className="slot-filter-list arts-filter-list" aria-label="Art categories">
                    {techniqueCategories.map((category) => (
                      <button
                        type="button"
                        key={category}
                        aria-pressed={activeTechniqueCategory === category}
                        onClick={() => setActiveTechniqueCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {visibleTechniques.length > 0 ? (
                    <ul className="arts-list">
                      {visibleTechniques.map((technique) => (
                        <li key={technique.id} className="arts-card">
                          <div className="arts-card-header">
                            {renderSlotIcon(technique.icon, technique.name)}
                            <div>
                              <strong>{technique.name}</strong>
                              <span>
                                {technique.category} art
                                {technique.realmRequirement
                                  ? ` · ${technique.realmRequirement} realm`
                                  : ""}
                              </span>
                            </div>
                          </div>
                          <p>{technique.description}</p>
                          <div className="arts-mastery-row">
                            <span>
                              Mastery {technique.mastery}/{technique.maxLevel}
                            </span>
                            <div
                              className="arts-mastery-track"
                              aria-label={`${technique.name} mastery progress`}
                            >
                              <span
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      (technique.mastery / Math.max(1, technique.maxLevel)) * 100,
                                    ),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="arts-benefits">
                            <span>Benefits</span>
                            <ul>
                              {getTechniqueBenefitLines(technique).map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="arts-empty-state">
                      {learnedTechniques.length > 0
                        ? "No arts match this filter."
                        : "Learn martial arts from elders, manuals, and dangerous discoveries."}
                    </p>
                  )}
                </div>
              ) : null}

              {activePathTab === "skills" ? (
                <div id="skills-panel" role="tabpanel" className="tab-panel">
                  <h2>Skill Trees</h2>
                  <div className="skill-layout">
                    <div className="slot-filter-list skill-filter-list" aria-label="Skill trees">
                      {skillTrees.map((tree) => (
                        <button
                          type="button"
                          key={tree}
                          aria-pressed={activeSkillTree === tree}
                          onClick={() => setActiveSkillTree(tree)}
                        >
                          {tree}
                        </button>
                      ))}
                    </div>
                    {visibleSkills.length > 0 ? (
                      <ul className="skill-card-list" aria-label="Known skills">
                        {visibleSkills.map((skill) => {
                          const effectSummary = formatSkillEffectSummary(skill, skill.rank);

                          return (
                            <li className="skill-card" key={skill.id}>
                              <div className="skill-card-header">
                                <span className="slot-icon">{skill.name.slice(0, 1)}</span>
                                <div>
                                  <strong>{skill.name}</strong>
                                  <span>{skill.tree}</span>
                                  <small>{formatSkillLevel(skill.rank, skill.maxRank)}</small>
                                </div>
                              </div>
                              <p>{skill.description}</p>
                              <div className="skill-exp-row">
                                <div className="skill-exp-summary">
                                  <span>{getSkillProgressStatus(skill)}</span>
                                  <strong>{getSkillExpLabel(skill)}</strong>
                                </div>
                                <div
                                  className="skill-exp-track"
                                  aria-label={`${skill.name} EXP progress`}
                                >
                                  <span style={{ width: `${getSkillExpPercent(skill)}%` }} />
                                </div>
                                <small>{getSkillLevelName(skill.rank)}</small>
                              </div>
                              <div className="skill-benefits">
                                <span>Benefits</span>
                                <ul>
                                  <li>{effectSummary || "No passive combat bonus yet."}</li>
                                  <li>{getSkillProgressSource(skill.tree)}</li>
                                </ul>
                              </div>
                              <div className="skill-bottleneck-note">
                                <span>Bottleneck</span>
                                <p>{getSkillBottleneckSummary(skill)}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="arts-empty-state">No skills match this tree.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <>
            <div className="overlay-panel-header">
              <strong>Save</strong>
              <button type="button" onClick={() => setRightTab("stats")}>
                ← Stats
              </button>
            </div>
            <section className="sidebar-panel-section">
              <h2>Save</h2>
              <div className="save-controls">
                {saveSlots.map((slotInfo) => (
                  <div className="save-slot" key={slotInfo.slot}>
                    <div>
                      <strong>Slot {slotInfo.slot}</strong>
                      <span>{getSaveSceneTitle(slotInfo.sceneId)}</span>
                      <small>{formatSaveTime(slotInfo.savedAt)}</small>
                    </div>
                    <button type="button" onClick={() => handleManualSave(slotInfo.slot)}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoad(slotInfo.slot)}
                      disabled={!slotInfo.exists}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearSave(slotInfo.slot)}
                      disabled={!slotInfo.exists}
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
              <button className="new-path-button" type="button" onClick={handleRestart}>
                New Path
              </button>
              <button className="new-path-button" type="button" onClick={handleLogout}>
                Logout
              </button>
              <p className="save-message">{saveMessage}</p>
            </section>
          </>
        )}
      </aside>
      {breakthroughResult ? (
        <section className="breakthrough-result-screen" aria-live="polite">
          <img
            src={breakthroughImagePath}
            alt=""
            className="breakthrough-result-image"
            aria-hidden="true"
          />
          <div className="breakthrough-result-shade" aria-hidden="true" />
          <div className="breakthrough-result-content">
            <p className="eyebrow">Breakthrough Successful</p>
            <h2>{breakthroughResult.realmLine}</h2>
            <strong>{breakthroughResult.qualityLabel}</strong>
            <p>{breakthroughResult.flavor}</p>
            {breakthroughResult.rewards.length > 0 ? (
              <div className="breakthrough-reward-panel">
                <h3 className="ornate-panel-title">Gained</h3>
                <div className="victory-rewards-panel">
                  {breakthroughResult.rewards.map((reward) => (
                    <div className="victory-reward-row" key={reward}>
                      <span className="victory-reward-icon">◎</span>
                      <span>{reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              className="victory-continue-btn"
              type="button"
              onClick={handleBreakthroughContinue}
            >
              Steady Your Breath
            </button>
          </div>
        </section>
      ) : null}
      {skillBreakthroughResult ? (
        <section
          className={`breakthrough-result-screen skill-breakthrough-result-screen ${skillBreakthroughResult.outcome}`}
          aria-live="polite"
        >
          <img
            src={skillBreakthroughResult.imagePath}
            alt=""
            className="breakthrough-result-image"
            aria-hidden="true"
          />
          <div className="breakthrough-result-shade" aria-hidden="true" />
          <div className="breakthrough-result-content">
            <p className="eyebrow">
              {skillBreakthroughResult.outcome === "success"
                ? "Breakthrough Craft Successful"
                : "Breakthrough Craft Failed"}
            </p>
            <h2>{skillBreakthroughResult.title}</h2>
            <strong>{skillBreakthroughResult.subtitle}</strong>
            <p>{skillBreakthroughResult.flavor}</p>
            <div className="breakthrough-reward-panel">
              <h3 className="ornate-panel-title">
                {skillBreakthroughResult.outcome === "success" ? "Gained" : "Result"}
              </h3>
              <div className="victory-rewards-panel">
                {skillBreakthroughResult.rewards.map((reward) => (
                  <div className="victory-reward-row" key={reward}>
                    <span className="victory-reward-icon">
                      {skillBreakthroughResult.outcome === "success" ? "◎" : "◇"}
                    </span>
                    <span>{reward}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="victory-continue-btn"
              type="button"
              onClick={handleSkillBreakthroughContinue}
            >
              {skillBreakthroughResult.continueLabel}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default App;
