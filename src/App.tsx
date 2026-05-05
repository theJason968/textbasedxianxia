import { useEffect, useMemo, useState } from "react";
import { Backpack, BookOpen, ListChecks, ScrollText, Workflow } from "lucide-react";
import scenes from "./data/scenes.json";
import items from "./data/items.json";
import techniques from "./data/techniques.json";
import skills from "./data/skills.json";
import constitutions from "./data/constitutions.json";
import enemies from "./data/enemies.json";
import quests from "./data/quests.json";
import npcs from "./data/npcs.json";
import { resolveCombatAction, type CombatAction } from "./engine/combatEngine";
import { canChoose } from "./engine/conditionEngine";
import {
  applyChoiceWithResult,
  getPlayerChangeMessages,
} from "./engine/consequenceEngine";
import { cultivate } from "./engine/cultivationEngine";
import { createInitialGameState } from "./engine/gameState";
import { equipItem, unequipItem, useItem } from "./engine/itemEngine";
import { clearSavedGame, hasSavedGame, loadGame, saveGame } from "./engine/saveEngine";
import { getSceneById } from "./engine/sceneEngine";
import {
  formatSkillEffectSummary,
  formatSkillLevel,
  formatSkillPracticeProgress,
} from "./engine/skillEngine";
import type {
  Choice,
  Constitution,
  ElementalEssence,
  EquipmentEffects,
  EquipmentSlot,
  Npc,
  Player,
  Quest,
  Scene,
  Skill,
} from "./engine/types";

const sceneData = scenes as Scene[];
const skillData = skills as Skill[];
const constitutionData = constitutions as Constitution[];
const npcData = npcs as unknown as Npc[];
const questData = quests as Quest[];
type CollectionTab = "inventory" | "techniques" | "skills" | "quests" | "journal";
type ItemData = {
  id: string;
  name: string;
  category?: string;
  rarity?: string;
  description?: string;
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
const itemData = items as ItemData[];
const equipmentSlotLabels: Record<EquipmentSlot, string> = {
  weapon: "Weapon",
  clothing: "Clothing",
  ring: "Ring",
  accessory: "Accessory",
};
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
]);
const mountainTrialScenes = new Set([
  "mountain_gate",
  "exam_registration",
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

  Object.entries(requirements.flags ?? {}).forEach(([flag, requiredValue]) => {
    if (player.flags[flag] !== requiredValue) {
      messages.push(formatFlagRequirement(flag, requiredValue));
    }
  });

  return messages;
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

function App() {
  const [gameState, setGameState] = useState(() => loadGame() ?? createInitialGameState());
  const [saveMessage, setSaveMessage] = useState(
    hasSavedGame() ? "Loaded saved cultivation path." : "No saved path yet.",
  );
  const [cultivationMessage, setCultivationMessage] = useState(
    "Cultivate after learning a breathing method.",
  );
  const [actionMessages, setActionMessages] = useState<string[]>([]);
  const [activeCollectionTab, setActiveCollectionTab] =
    useState<CollectionTab>("inventory");
  const currentScene = useMemo(
    () => getSceneById(sceneData, gameState.currentSceneId),
    [gameState.currentSceneId],
  );
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
          mastery: gameState.player.techniqueMastery[techniqueId] ?? 0,
        };
      }),
    [gameState.player.techniqueMastery, gameState.player.techniques],
  );
  const learnedSkillTrees = useMemo(() => {
    const learnedSkills = Object.entries(gameState.player.skills)
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
      .sort((firstSkill, secondSkill) => firstSkill.tier - secondSkill.tier);

    return learnedSkills.reduce<Record<string, typeof learnedSkills>>(
      (trees, skill) => ({
        ...trees,
        [skill.tree]: [...(trees[skill.tree] ?? []), skill],
      }),
      {},
    );
  }, [gameState.player.skillPractice, gameState.player.skills]);
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
  const groupedOwnedItems = useMemo(
    () =>
      ownedItems.reduce<Record<string, typeof ownedItems>>((groups, item) => {
        const category = item.category ?? "Misc";

        return {
          ...groups,
          [category]: [...(groups[category] ?? []), item],
        };
      }, {}),
    [ownedItems],
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

  useEffect(() => {
    saveGame(gameState);
  }, [gameState]);

  function handleChoice(choice: Choice) {
    const result = applyChoiceWithResult(gameState, choice);

    setGameState(result.gameState);
    setActionMessages(result.messages);
    setSaveMessage("Autosaved.");
  }

  function handleRestart() {
    clearSavedGame();
    setGameState(createInitialGameState());
    setActionMessages([]);
    setSaveMessage("Started a new path.");
    setCultivationMessage("Cultivate after learning a breathing method.");
  }

  function handleManualSave() {
    saveGame(gameState);
    setSaveMessage("Saved.");
  }

  function handleLoad() {
    const savedGame = loadGame();

    if (savedGame) {
      setGameState(savedGame);
      setSaveMessage("Loaded saved path.");
      return;
    }

    setSaveMessage("No saved path found.");
  }

  function handleCultivate() {
    const result = cultivate(gameState);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Autosaved.");
  }

  function handleUseItem(item: ItemData) {
    const result = useItem(gameState, item);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Autosaved.");
  }

  function handleEquipItem(item: ItemData) {
    const result = equipItem(gameState, item);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Autosaved.");
  }

  function handleUnequipItem(slot: EquipmentSlot) {
    const result = unequipItem(gameState, slot);

    setGameState(result.gameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, result.gameState.player));
    setCultivationMessage(result.message);
    setSaveMessage("Autosaved.");
  }

  function handleCombatAction(action: CombatAction) {
    if (!activeEnemy) {
      return;
    }

    const nextGameState = resolveCombatAction(gameState, activeEnemy, action);

    setGameState(nextGameState);
    setActionMessages(getPlayerChangeMessages(gameState.player, nextGameState.player));
    setSaveMessage("Autosaved.");
  }

  return (
    <main className="app-shell">
      <section className="story-panel">
        <p className="eyebrow">{getSceneLocationTitle(currentScene.id)}</p>
        <h1>{currentScene.title}</h1>
        <p className="scene-body">{currentScene.body}</p>
        {actionMessages.length > 0 ? (
          <ul className="action-messages" aria-live="polite">
            {actionMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
        {gameState.combat && activeEnemy ? (
          <div className="combat-panel">
            <div>
              <p className="eyebrow">Combat</p>
              <h2>{activeEnemy.name}</h2>
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
              <button type="button" onClick={() => handleCombatAction("flee")}>
                Retreat
              </button>
            </div>
            <ul className="combat-log">
              {gameState.combat.log.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="choices">
            {currentScene.choices.length > 0 ? (
              currentScene.choices.map((choice) => {
                const isAvailable = canChoose(gameState, choice);
                const requirementSummary = getChoiceRequirementSummary(
                  gameState.player,
                  choice,
                );

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
                      {choice.label}
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
      </section>

      <aside className="side-panel">
        <h2>Disciple</h2>
        <dl>
          <div>
            <dt>Realm</dt>
            <dd>
              {gameState.player.realm} {gameState.player.stage}
            </dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>
              {gameState.player.health}/{gameState.player.maxHealth}
            </dd>
          </div>
          <div>
            <dt>Qi</dt>
            <dd>
              {gameState.player.qi}/{gameState.player.maxQi}
            </dd>
          </div>
          <div>
            <dt>Strength</dt>
            <dd>{gameState.player.strength}</dd>
          </div>
          <div>
            <dt>Agility</dt>
            <dd>{gameState.player.agility}</dd>
          </div>
          <div>
            <dt>Endurance</dt>
            <dd>{gameState.player.endurance}</dd>
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
            <dt>Spiritual Sense</dt>
            <dd>{gameState.player.spiritualSense}</dd>
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
            <dd>{gameState.player.foundationStability}%</dd>
          </div>
          <div>
            <dt>Fatigue</dt>
            <dd>{gameState.player.trainingFatigue}/10</dd>
          </div>
          <div>
            <dt>Impurity</dt>
            <dd>{gameState.player.impurity}</dd>
          </div>
          <div>
            <dt>Insight</dt>
            <dd>{gameState.player.cultivationInsight}</dd>
          </div>
          <div>
            <dt>Spirit Stones</dt>
            <dd>{gameState.player.spiritStones}</dd>
          </div>
          <div>
            <dt>
              {hasLearnedAboutMountainGate(gameState.player) ? "Mountain Gate" : "Day"}
            </dt>
            <dd>
              {hasLearnedAboutMountainGate(gameState.player)
                ? gameState.player.daysRemainingToExam > 0
                  ? `${gameState.player.daysRemainingToExam} days`
                  : "Today"
                : "Ordinary morning"}
            </dd>
          </div>
        </dl>

        <h2>Constitution</h2>
        {awakenedConstitutions.length > 0 ? (
          <ul className="compact-list">
            {awakenedConstitutions.map((constitution) => (
              <li key={constitution.id}>
                <span>
                  {constitution.name}
                  <small className="effect-summary">{constitution.description}</small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Dormant</p>
        )}

        <h2>Stored Elements</h2>
        {storedElements.length > 0 ? (
          <ul className="compact-list">
            {storedElements.map(([element, amount]) => (
              <li key={element}>
                <span>{element}</span>
                <small>{amount}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>None stored</p>
        )}

        <h2>Cultivation</h2>
        <div className="cultivation-meter" aria-label="Qi progress">
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

        <section className="collection-tabs" aria-label="Character collections">
          <div className="tab-list" role="tablist" aria-label="Character collections">
            <button
              type="button"
              role="tab"
              aria-selected={activeCollectionTab === "inventory"}
              aria-controls="inventory-panel"
              onClick={() => setActiveCollectionTab("inventory")}
            >
              <Backpack aria-hidden="true" size={16} />
              <span>Inventory</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCollectionTab === "techniques"}
              aria-controls="techniques-panel"
              onClick={() => setActiveCollectionTab("techniques")}
            >
              <ScrollText aria-hidden="true" size={16} />
              <span>Techniques</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCollectionTab === "skills"}
              aria-controls="skills-panel"
              onClick={() => setActiveCollectionTab("skills")}
            >
              <Workflow aria-hidden="true" size={16} />
              <span>Skills</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCollectionTab === "quests"}
              aria-controls="quests-panel"
              onClick={() => setActiveCollectionTab("quests")}
            >
              <ListChecks aria-hidden="true" size={16} />
              <span>Quests</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCollectionTab === "journal"}
              aria-controls="journal-panel"
              onClick={() => setActiveCollectionTab("journal")}
            >
              <BookOpen aria-hidden="true" size={16} />
              <span>Journal</span>
            </button>
          </div>

          {activeCollectionTab === "inventory" ? (
            <div id="inventory-panel" role="tabpanel" className="tab-panel">
              <h2>Inventory</h2>
              {ownedItems.length > 0 ? (
                <div className="inventory-groups">
                  {equippedItems.length > 0 ? (
                    <section className="inventory-group">
                      <h3>Equipped</h3>
                      <ul className="compact-list">
                        {equippedItems.map(({ slot, item }) => (
                          <li key={slot}>
                            <span>
                              {equipmentSlotLabels[slot]}: {item?.name ?? "Unknown item"}
                              {item?.equipmentEffects ? (
                                <small className="effect-summary">
                                  {formatEquipmentEffects(item.equipmentEffects)}
                                </small>
                              ) : null}
                            </span>
                            <button type="button" onClick={() => handleUnequipItem(slot)}>
                              Unequip
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {Object.entries(groupedOwnedItems).map(([category, categoryItems]) => (
                    <section key={category} className="inventory-group">
                      <h3>{category}</h3>
                      <ul className="compact-list">
                        {categoryItems.map((item, index) => {
                          const isEquipped =
                            item.equipmentSlot &&
                            gameState.player.equipment[item.equipmentSlot] === item.id;

                          return (
                            <li key={`${item.id}-${index}`}>
                              <span>
                                {item.name}
                                {item.description ? (
                                  <small className="effect-summary">
                                    {item.description}
                                  </small>
                                ) : null}
                                {item.equipmentEffects ? (
                                  <small className="effect-summary">
                                    {formatEquipmentEffects(item.equipmentEffects)}
                                  </small>
                                ) : null}
                              </span>
                              {Object.keys(item.effects).length > 0 ? (
                                <button type="button" onClick={() => handleUseItem(item)}>
                                  Use
                                </button>
                              ) : null}
                              {item.equipmentSlot ? (
                                <button
                                  type="button"
                                  onClick={() => handleEquipItem(item)}
                                  disabled={isEquipped}
                                >
                                  {isEquipped ? "Equipped" : "Equip"}
                                </button>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <p>Empty</p>
              )}
            </div>
          ) : null}

          {activeCollectionTab === "techniques" ? (
            <div id="techniques-panel" role="tabpanel" className="tab-panel">
              <h2>Techniques</h2>
              {learnedTechniques.length > 0 ? (
                <ul className="compact-list">
                  {learnedTechniques.map((technique) => (
                    <li key={technique.id}>
                      <span>{technique.name}</span>
                      <small>Mastery {technique.mastery}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>None learned</p>
              )}
            </div>
          ) : null}

          {activeCollectionTab === "skills" ? (
            <div id="skills-panel" role="tabpanel" className="tab-panel">
              <h2>Skill Trees</h2>
              {Object.keys(learnedSkillTrees).length > 0 ? (
                <div className="skill-tree-list">
                  {Object.entries(learnedSkillTrees).map(([tree, treeSkills]) => (
                    <section key={tree} className="skill-tree">
                      <h3>{tree}</h3>
                      <ul className="compact-list">
                        {treeSkills.map((skill) => (
                          <li key={skill.id}>
                            <span>
                              {skill.name}
                              {formatSkillEffectSummary(skill, skill.rank) ? (
                                <small className="effect-summary">
                                  {formatSkillEffectSummary(skill, skill.rank)}
                                </small>
                              ) : null}
                            </span>
                            <small>
                              {formatSkillLevel(skill.rank, skill.maxRank)}
                              {formatSkillPracticeProgress(
                                skill.rank,
                                skill.maxRank,
                                skill.practice,
                              ) ? (
                                <span className="effect-summary">
                                  {formatSkillPracticeProgress(
                                    skill.rank,
                                    skill.maxRank,
                                    skill.practice,
                                  )}
                                </span>
                              ) : null}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <p>No skills developed</p>
              )}
            </div>
          ) : null}

          {activeCollectionTab === "quests" ? (
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

          {activeCollectionTab === "journal" ? (
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
        </section>

        <h2>Save</h2>
        <div className="save-controls">
          <button type="button" onClick={handleManualSave}>
            Save
          </button>
          <button type="button" onClick={handleLoad}>
            Load
          </button>
          <button type="button" onClick={handleRestart}>
            Reset
          </button>
        </div>
        <p className="save-message">{saveMessage}</p>
      </aside>
    </main>
  );
}

export default App;
