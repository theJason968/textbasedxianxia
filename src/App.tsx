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
  canCraftRecipe,
  craftRecipe,
  getInventoryCounts,
  type CraftingRecipe,
} from "./engine/craftingEngine";
import {
  applyChoiceWithResult,
  getPlayerChangeMessages,
} from "./engine/consequenceEngine";
import { cultivate } from "./engine/cultivationEngine";
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
} from "./engine/skillEngine";
import type {
  Choice,
  CharacterGender,
  Constitution,
  ElementalEssence,
  EquipmentEffects,
  EquipmentSlot,
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
const npcData = npcs as unknown as Npc[];
const questData = quests as Quest[];
const recipeData = craftingRecipes as unknown as CraftingRecipe[];
const sceneAreaData = sceneAreas as SceneArea[];
type PackTab = "inventory" | "crafting";
type PathTab = "quests" | "journal" | "techniques" | "skills";
type RightPanelTab = "stats" | "pack" | "path" | "save";
type StartView = "auth" | "character" | "game";
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
): string[] {
  const inventoryCounts = getInventoryCounts(player.inventory);
  const missingIngredients = Object.entries(recipe.ingredients)
    .filter(([itemId, requiredCount]) => (inventoryCounts[itemId] ?? 0) < requiredCount)
    .map(([itemId, requiredCount]) => {
      const itemName = itemData.find((item) => item.id === itemId)?.name ?? itemId;

      return `${itemName} ${requiredCount} (${inventoryCounts[itemId] ?? 0})`;
    });
  const missingSkills = Object.entries(recipe.requiresSkills ?? {})
    .filter(([skillId, requiredRank]) => (player.skills[skillId] ?? 0) < requiredRank)
    .map(([skillId, requiredRank]) => {
      const skillName = skillData.find((skill) => skill.id === skillId)?.name ?? skillId;

      return `${skillName} rank ${requiredRank} (${player.skills[skillId] ?? 0})`;
    });

  return [...missingIngredients, ...missingSkills];
}

function formatRecipeIngredients(recipe: CraftingRecipe): string {
  return Object.entries(recipe.ingredients)
    .map(([itemId, count]) => {
      const itemName = itemData.find((item) => item.id === itemId)?.name ?? itemId;

      return `${count} ${itemName}`;
    })
    .join(", ");
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

function App() {
  const [profileSession, setProfileSession] = useState<ProfileSession | null>(
    () => getStoredSession(),
  );
  const [gameState, setGameState] = useState(
    () => loadLatestGame() ?? createInitialGameState(),
  );
  const [startView, setStartView] = useState<StartView>(() =>
    getStoredSession()
      ? hasCreatedCharacter(loadLatestGame()?.player ?? createInitialGameState().player)
        ? "game"
        : "character"
      : "auth",
  );
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("Register, log in, or continue as guest.");
  const [characterName, setCharacterName] = useState("");
  const [characterGender, setCharacterGender] = useState<CharacterGender>("male");
  const [characterMessage, setCharacterMessage] = useState("Name the person the story will remember.");
  const [saveMessage, setSaveMessage] = useState(
    hasAnySavedGame()
      ? "Loaded the most recent saved path."
      : "No saved path yet.",
  );
  const [saveSlots, setSaveSlots] = useState(() => getSaveSlots());
  const [cultivationMessage, setCultivationMessage] = useState(
    "Cultivate after learning a breathing method.",
  );
  const [actionMessages, setActionMessages] = useState<string[]>([]);
  const [rightTab, setRightTab] = useState<RightPanelTab>("stats");
  const [showFullStats, setShowFullStats] = useState(false);
  const [activePackTab, setActivePackTab] = useState<PackTab>("inventory");
  const [activePathTab, setActivePathTab] = useState<PathTab>("quests");
  const [activeInventoryCategory, setActiveInventoryCategory] = useState("All");
  const [activeTechniqueCategory, setActiveTechniqueCategory] = useState("All");
  const [activeSkillTree, setActiveSkillTree] = useState("All");
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
  const activeEnemy = useMemo(
    () =>
      gameState.combat
        ? enemies.find((enemy) => enemy.id === gameState.combat?.enemyId)
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
          maxLevel: technique?.maxLevel ?? 1,
          mastery: gameState.player.techniqueMastery[techniqueId] ?? 0,
        };
      }),
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
            }
          : null;
      })
      .filter((skill) => skill !== null)
      .sort((firstSkill, secondSkill) => firstSkill.tier - secondSkill.tier),
    [gameState.player.skillPractice, gameState.player.skills],
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
      recipeData.map((recipe) => ({
        recipe,
        canCraft: canCraftRecipe(gameState.player, recipe),
        missingRequirements: getRecipeRequirementSummary(gameState.player, recipe),
        resultItem: itemData.find((item) => item.id === recipe.resultItem),
      })),
    [gameState.player],
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

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result =
      authMode === "register"
        ? registerProfile(authUsername, authPassword)
        : loginProfile(authUsername, authPassword);

    setAuthMessage(result.message);

    if (!result.session) {
      return;
    }

    setProfileSession(result.session);
    setAuthPassword("");
    setStartView(hasCreatedCharacter(gameState.player) ? "game" : "character");
  }

  function handleGuestLogin() {
    const session = continueAsGuest();

    setProfileSession(session);
    setAuthMessage("Continuing as guest.");
    setStartView(hasCreatedCharacter(gameState.player) ? "game" : "character");
  }

  function handleCreateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = characterName.trim();

    if (trimmedName.length < 2) {
      setCharacterMessage("Enter a character name with at least 2 characters.");
      return;
    }

    setGameState(createCharacterState(trimmedName, characterGender));
    setActionMessages([]);
    setSaveMessage("Character created. Save into a slot when ready.");
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
    const result = applyChoiceWithResult(gameState, choice);

    setGameState(result.gameState);
    setActionMessages(result.messages);
    setSaveMessage("Unsaved changes.");
  }

  function handleRestart() {
    setGameState(createCharacterState(gameState.player.name, gameState.player.gender));
    setActionMessages([]);
    setSaveMessage("Started a new path. Save it into a slot when ready.");
    setCultivationMessage("Cultivate after learning a breathing method.");
  }

  function handleManualSave(slot: SaveSlot) {
    saveGame(slot, gameState);
    setSaveSlots(getSaveSlots());
    setSaveMessage(`Saved to slot ${slot}.`);
  }

  function handleLoad(slot: SaveSlot) {
    const savedGame = loadGame(slot);

    if (savedGame) {
      setGameState(savedGame);
      setActionMessages([]);
      setSaveMessage("Loaded saved path.");
      return;
    }

    setSaveMessage(`Slot ${slot} is empty.`);
  }

  function handleClearSave(slot: SaveSlot) {
    clearSavedGame(slot);
    setSaveSlots(getSaveSlots());
    setSaveMessage(`Cleared slot ${slot}.`);
  }

  function handleCultivate() {
    const result = cultivate(gameState);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
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
    const result = craftRecipe(gameState, recipe);

    setGameState(result.gameState);
    setActionMessages([
      ...getPlayerChangeMessages(gameState.player, result.gameState.player),
      result.message,
    ]);
    setSaveMessage("Unsaved changes.");
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextState = resolvePostCombatChoice(gameState, activeEnemy as any, choiceId);
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
          Realm: {gameState.player.realm} {gameState.player.stage}
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
        {gameState.combat?.resolved && activeEnemy ? (
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
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {getPostCombatChoices(gameState.player, activeEnemy as any).map((choice) => (
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
                  <dt>Attack</dt>
                  <dd>{gameState.player.strength}</dd>
                </div>
                <div>
                  <dt>Defense</dt>
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
                  <ul className="crafting-list">
                    {availableRecipes.map(
                      ({ recipe, canCraft, missingRequirements, resultItem }) => (
                        <li key={recipe.id}>
                          <div>
                            <strong>{recipe.name}</strong>
                            <span>
                              {formatItemTier(recipe.tier)} {recipe.category}
                            </span>
                            <p>{recipe.description}</p>
                            <small>Needs {formatRecipeIngredients(recipe)}</small>
                            {resultItem ? (
                              <small>
                                Creates {recipe.quantity} {formatItemTier(resultItem.tier)}{" "}
                                {resultItem.name}
                              </small>
                            ) : null}
                            {!canCraft && missingRequirements.length > 0 ? (
                              <small>Missing {missingRequirements.join(", ")}</small>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={!canCraft}
                            onClick={() => handleCraftRecipe(recipe)}
                          >
                            Craft
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
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
                  <h2>Techniques</h2>
                  <div className="slot-board">
                    <div className="slot-grid" aria-label="Technique slots">
                      {visibleTechniques.map((technique) => (
                        <div
                          className="inventory-slot filled-slot"
                          key={technique.id}
                          title={[
                            technique.name,
                            technique.description,
                            `Mastery ${technique.mastery}/${technique.maxLevel}`,
                          ].join("\n")}
                        >
                          <span className="slot-icon">{technique.name.slice(0, 1)}</span>
                          <strong>{technique.name}</strong>
                          <small>{technique.category}</small>
                          <small>Mastery {technique.mastery}/{technique.maxLevel}</small>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 12 - visibleTechniques.length) }).map((_, index) => (
                        <div className="inventory-slot empty-slot" key={`empty-tech-${index}`}>
                          <span className="slot-icon">+</span>
                        </div>
                      ))}
                    </div>
                    <div className="slot-filter-list" aria-label="Technique categories">
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
                  </div>
                </div>
              ) : null}

              {activePathTab === "skills" ? (
                <div id="skills-panel" role="tabpanel" className="tab-panel">
                  <h2>Skill Trees</h2>
                  <div className="slot-board">
                    <div className="slot-grid" aria-label="Skill slots">
                      {visibleSkills.map((skill) => (
                        <div
                          className="inventory-slot filled-slot"
                          key={skill.id}
                          title={[
                            skill.name,
                            skill.description,
                            formatSkillLevel(skill.rank, skill.maxRank),
                            formatSkillEffectSummary(skill, skill.rank),
                          ]
                            .filter((line) => line)
                            .join("\n")}
                        >
                          <span className="slot-icon">{skill.name.slice(0, 1)}</span>
                          <strong>{skill.name}</strong>
                          <small>{skill.tree}</small>
                          <small>{formatSkillLevel(skill.rank, skill.maxRank)}</small>
                          {formatSkillEffectSummary(skill, skill.rank) ? (
                            <small>{formatSkillEffectSummary(skill, skill.rank)}</small>
                          ) : null}
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 12 - visibleSkills.length) }).map((_, index) => (
                        <div className="inventory-slot empty-slot" key={`empty-skill-${index}`}>
                          <span className="slot-icon">+</span>
                        </div>
                      ))}
                    </div>
                    <div className="slot-filter-list" aria-label="Skill trees">
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
    </main>
  );
}

export default App;
