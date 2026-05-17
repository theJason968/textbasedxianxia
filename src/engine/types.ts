export type Realm = "Mortal" | "Qi Condensation" | "Foundation Establishment";

export type RealmStage = "Early" | "Middle" | "Late" | "Peak";
export type FoundationQuality =
  | "fractured"
  | "unstable"
  | "stable"
  | "refined"
  | "perfect";

export type ElementalEssence =
  | "Water"
  | "Wood"
  | "Fire"
  | "Earth"
  | "Metal"
  | "Wind"
  | "Cloud"
  | "Ice"
  | "Lightning";

export type CharacterGender = "female" | "male";

export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";

export type ItemTier =
  | "mortal"
  | "low_grade_spirit"
  | "mid_grade_spirit"
  | "high_grade_spirit"
  | "earth"
  | "heaven"
  | "profound"
  | "saint"
  | "immortal"
  | "dao";

export type Player = {
  name: string;
  gender: CharacterGender;
  realm: Realm;
  stage: RealmStage;
  foundationQuality?: FoundationQuality;
  health: number;
  maxHealth: number;
  qi: number;
  maxQi: number;
  strength: number;
  agility: number;
  endurance: number;
  intelligence: number;
  perception: number;
  spiritualSense: number;
  physique: number;
  comprehension: number;
  willpower: number;
  karma: number;
  foundationStability: number;
  trainingFatigue: number;
  impurity: number;
  cultivationInsight: number;
  day: number;
  timeOfDay: TimeOfDay;
  daysRemainingToExam: number;
  spiritStones: number;
  inventory: string[];
  knownRecipes: string[];
  equipment: Partial<Record<EquipmentSlot, string>>;
  techniques: string[];
  skills: Record<string, number>;
  skillPractice: Record<string, number>;
  elementalEssence: Partial<Record<ElementalEssence, number>>;
  constitutions: string[];
  techniqueMastery: Record<string, number>;
  quests: Record<string, PlayerQuest>;
  npcJournal: Record<string, PlayerNpcJournalEntry>;
  relationships: SocialScores;
  reputation: SocialScores;
  morality: SocialScores;
  sectContribution: SocialScores;
  corruption: number;
  flags: Record<string, boolean | number | string>;
};

export type EquipmentSlot = "weapon" | "clothing" | "ring" | "accessory";

export type EquipmentEffects = {
  combatDamage?: number;
  combatDefense?: number;
  maxHealth?: number;
  maxQi?: number;
};

export type QuestStatus = "active" | "completed" | "failed";

export type PlayerNpcJournalEntry = {
  met: boolean;
  conversations: string[];
};

export type SocialScores = Record<string, number>;

export type PlayerQuest = {
  status: QuestStatus;
  step: number;
};

export type Quest = {
  id: string;
  name: string;
  description: string;
  steps: string[];
  rewards?: {
    items?: string[];
    spiritStones?: number;
  };
};

export type NpcDisposition =
  | "mentor"
  | "ally"
  | "rival"
  | "neutral"
  | "antagonist";

export type Npc = {
  id: string;
  name: string;
  title: string;
  disposition: NpcDisposition;
  faction: string;
  firstSceneId: string;
  description: string;
  personality: string[];
  relationshipToPlayer: string;
  skills: Record<string, number>;
  teachesSkills?: string[];
  associatedQuests?: string[];
  memoryFlags?: string[];
  returnHooks: string[];
};

export type EnemyPhase = {
  threshold: number;
  announcement: string;
  attackLines: string[];
  damageMultiplier?: number;
};

export type EnemyPostCombatType = "beast" | "spirit" | "mortal" | "cultivator";

export type Enemy = {
  id: string;
  name: string;
  description: string;
  cultivation?: { realm: Realm; stage: RealmStage };
  maxHealth: number;
  attack: number;
  defense: number;
  qiReward: number;
  spiritStoneReward?: number;
  itemRewards?: string[];
  phase?: EnemyPhase;
  postCombatType?: EnemyPostCombatType;
  secretStash?: { spiritStones?: number; itemRewards?: string[] };
  teachableTechnique?: string;
  speechDifficulty?: number;
};

export type SkillTree =
  | "Mortal Foundation"
  | "Martial Arts"
  | "Body Tempering"
  | "Mind And Perception"
  | "Social Bearing"
  | "Survival"
  | "Alchemy"
  | "Blacksmithing"
  | "Cultivation Foundation"
  | "Azure Cloud Methods";

export type Skill = {
  id: string;
  name: string;
  tree: SkillTree;
  tier: number;
  maxRank: number;
  description: string;
  effects?: SkillEffects;
  requiresSkills?: Record<string, number>;
  requiresStats?: Partial<
    Pick<
      Player,
      | "spiritualSense"
      | "strength"
      | "agility"
      | "endurance"
      | "intelligence"
      | "perception"
      | "physique"
      | "comprehension"
      | "willpower"
      | "karma"
      | "foundationStability"
      | "cultivationInsight"
    >
  >;
};

export type SkillEffects = {
  combatDamage?: number;
  combatDefense?: number;
};

export type Constitution = {
  id: string;
  name: string;
  description: string;
  requiredElements: Partial<Record<ElementalEssence, number>>;
};

export type CombatPowerTier = "dominant" | "contested" | "struggling";

export type PostCombatChoiceId =
  | "spare"
  | "spare_oath"
  | "interrogate_spare"
  | "interrogate_kill"
  | "kill"
  | "kill_harvest_qi"
  | "kill_take_technique"
  | "kill_defile"
  | "strip_cultivation"
  | "absorb_death_qi"
  | "leave";

export type PostCombatAlignment = "light" | "neutral" | "dark";

export type PostCombatState = {
  stage: "choosing" | "result";
  choiceId?: PostCombatChoiceId;
  messages: string[];
};

export type CombatLogEntry = {
  text: string;
  type: "player" | "enemy" | "system";
  turn: number;
};

export type CombatRewards = {
  spiritStones: number;
  qi: number;
  items: string[];
};

export type CombatState = {
  enemyId: string;
  enemyHealth: number;
  turn: number;
  victorySceneId: string;
  defeatSceneId: string;
  log: CombatLogEntry[];
  powerTier: CombatPowerTier;
  playerStartHealth: number;
  resolved?: boolean;
  reflection?: string;
  rewards?: CombatRewards;
  phaseTriggered?: boolean;
  postCombat?: PostCombatState;
};

export type GameState = {
  currentSceneId: string;
  player: Player;
  combat: CombatState | null;
};

export type ChoiceEffect = Partial<
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
    | "daysRemainingToExam"
    | "spiritStones"
    | "corruption"
  >
> & {
  advanceTime?: number;
  advanceDays?: number;
  deadlineScene?: string;
  addItems?: string[];
  equipItem?: {
    slot: EquipmentSlot;
    itemId: string;
  };
  breakthrough?: {
    realm?: Realm;
    stage: RealmStage;
    foundationQuality?: FoundationQuality;
    foundationCost?: number;
  };
  learnTechniques?: string[];
  learnRecipes?: string[];
  addSkills?: Record<string, number>;
  addElements?: Partial<Record<ElementalEssence, number>>;
  awakenConstitutions?: string[];
  techniqueMastery?: Record<string, number>;
  startQuest?: string;
  updateQuest?: {
    questId: string;
    step: number;
  };
  completeQuest?: string;
  failQuest?: string;
  meetNpc?: string;
  recordNpcConversation?: {
    npcId: string;
    topic: string;
  };
  relationships?: SocialScores;
  reputation?: SocialScores;
  morality?: SocialScores;
  sectContribution?: SocialScores;
  corruption?: number;
  messages?: string[];
  setFlags?: Record<string, boolean | number | string>;
  startCombat?: {
    enemyId: string;
    victorySceneId: string;
    defeatSceneId: string;
  };
};

export type ChoiceRequirement = {
  stats?: Partial<
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
      | "daysRemainingToExam"
      | "spiritStones"
    >
  >;
  realm?: Realm;
  stage?: RealmStage;
  items?: string[];
  recipes?: string[];
  techniques?: string[];
  skills?: Record<string, number>;
  elements?: Partial<Record<ElementalEssence, number>>;
  constitutions?: string[];
  relationships?: SocialScores;
  reputation?: SocialScores;
  morality?: SocialScores;
  sectContribution?: SocialScores;
  corruption?: number;
  flags?: Record<string, boolean | number | string>;
  flagsAbsent?: string[];
  techniqueMastery?: Record<string, number>;
};

export type BoardPosition = {
  x: number;
  y: number;
  rotation?: number;
};

export type Choice = {
  label: string;
  nextScene: string;
  requires?: ChoiceRequirement;
  effects?: ChoiceEffect;
  outcomes?: ChoiceOutcome[];
  delay?: ChoiceDelay;
  boardPosition?: BoardPosition;
  boardDescription?: string;
  boardReward?: string;
  hidden?: boolean;
};

export type ChoiceDelay = {
  seconds?: number;
  stages: string[];
  resultTitle?: string;
  resultBody?: string;
};

export type ChoiceOutcome = {
  nextScene: string;
  requires?: ChoiceRequirement;
  effects?: ChoiceEffect;
};

export type CombatNarration = {
  opening?: string[];
  strike?: string[];
  focus?: string[];
  enemyAttack?: string[];
  victory?: string[];
  defeat?: string[];
};

export type SceneImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type SceneArea = {
  id: string;
  name: string;
  image?: SceneImage;
};

export type SceneStatus = {
  label: string;
  value: number;
  max: number;
};

export type Scene = {
  id: string;
  areaId?: string;
  title: string;
  body: string;
  image?: SceneImage;
  status?: SceneStatus;
  combatNarration?: CombatNarration;
  choices: Choice[];
  type?: "questBoard";
  boardImage?: string;
};
