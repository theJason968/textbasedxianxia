import { createInitialGameState } from "./gameState";
import type { GameState, Player } from "./types";

export type SaveSlot = 1 | 2 | 3;

export type SaveSlotInfo = {
  slot: SaveSlot;
  exists: boolean;
  sceneId?: string;
  savedAt?: string;
};

const legacySaveKey = "xianxia-text-adventure-save-v1";
const unscopedSaveSlotPrefix = "xianxia-text-adventure-save-slot";
const profileSaveSlotPrefix = "xianxia-text-adventure-profile-save";
const saveSlots: SaveSlot[] = [1, 2, 3];

type StoredSave = {
  savedAt: string;
  gameState: Partial<GameState>;
};

export function saveGame(owner: string | null | undefined, slot: SaveSlot, gameState: GameState): void {
  const storedSave: StoredSave = {
    savedAt: new Date().toISOString(),
    gameState,
  };

  localStorage.setItem(getSaveSlotKey(owner, slot), JSON.stringify(storedSave));
}

export function loadGame(owner: string | null | undefined, slot: SaveSlot): GameState | null {
  const savedGame = getStoredSlotSave(owner, slot);

  if (!savedGame.value) {
    return null;
  }

  try {
    return mergeWithInitialState(parseStoredSave(savedGame.value).gameState);
  } catch {
    localStorage.removeItem(savedGame.key);
    return null;
  }
}

export function loadLatestGame(owner: string | null | undefined): GameState | null {
  const latestSlot = getSaveSlots(owner)
    .filter((slot) => slot.exists && slot.savedAt)
    .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))[0];

  if (latestSlot) {
    return loadGame(owner, latestSlot.slot);
  }

  return loadLegacyGame();
}

export function clearSavedGame(owner: string | null | undefined, slot: SaveSlot): void {
  localStorage.removeItem(getSaveSlotKey(owner, slot));
  localStorage.removeItem(getUnscopedSaveSlotKey(slot));
}

export function getSaveSlots(owner: string | null | undefined): SaveSlotInfo[] {
  return saveSlots.map((slot) => {
    const savedGame = getStoredSlotSave(owner, slot).value;

    if (!savedGame) {
      return {
        slot,
        exists: false,
      };
    }

    try {
      const storedSave = parseStoredSave(savedGame);

      return {
        slot,
        exists: true,
        sceneId: storedSave.gameState.currentSceneId,
        savedAt: storedSave.savedAt,
      };
    } catch {
      return {
        slot,
        exists: true,
      };
    }
  });
}

export function hasAnySavedGame(owner: string | null | undefined): boolean {
  return getSaveSlots(owner).some((slot) => slot.exists) || localStorage.getItem(legacySaveKey) !== null;
}

function loadLegacyGame(): GameState | null {
  const savedGame = localStorage.getItem(legacySaveKey);

  if (!savedGame) {
    return null;
  }

  try {
    return mergeWithInitialState(JSON.parse(savedGame) as Partial<GameState>);
  } catch {
    localStorage.removeItem(legacySaveKey);
    return null;
  }
}

function parseStoredSave(savedGame: string): StoredSave {
  const parsedSave = JSON.parse(savedGame) as Partial<StoredSave> | Partial<GameState>;

  if ("gameState" in parsedSave && parsedSave.gameState) {
    return {
      savedAt: parsedSave.savedAt ?? new Date(0).toISOString(),
      gameState: parsedSave.gameState,
    };
  }

  return {
    savedAt: new Date(0).toISOString(),
    gameState: parsedSave as Partial<GameState>,
  };
}

function getStoredSlotSave(owner: string | null | undefined, slot: SaveSlot): { key: string; value: string | null } {
  const profileKey = getSaveSlotKey(owner, slot);
  const profileSave = localStorage.getItem(profileKey);

  if (profileSave) {
    return { key: profileKey, value: profileSave };
  }

  const unscopedKey = getUnscopedSaveSlotKey(slot);
  return { key: unscopedKey, value: localStorage.getItem(unscopedKey) };
}

function getSaveSlotKey(owner: string | null | undefined, slot: SaveSlot): string {
  return `${profileSaveSlotPrefix}-${normalizeSaveOwner(owner)}-slot-${slot}`;
}

function getUnscopedSaveSlotKey(slot: SaveSlot): string {
  return `${unscopedSaveSlotPrefix}-${slot}`;
}

function normalizeSaveOwner(owner: string | null | undefined): string {
  return encodeURIComponent(owner?.trim().toLowerCase() || "guest");
}

function mergeWithInitialState(savedGame: Partial<GameState>): GameState {
  const initialState = createInitialGameState();

  return {
    ...initialState,
    ...savedGame,
    player: mergePlayer(initialState.player, savedGame.player),
  };
}

function mergePlayer(initialPlayer: Player, savedPlayer?: Partial<Player>): Player {
  const savedQuests = Array.isArray(savedPlayer?.quests)
    ? initialPlayer.quests
    : savedPlayer?.quests;

  return {
    ...initialPlayer,
    ...savedPlayer,
    gender: savedPlayer?.gender ?? initialPlayer.gender,
    inventory: savedPlayer?.inventory ?? initialPlayer.inventory,
    knownRecipes: savedPlayer?.knownRecipes ?? initialPlayer.knownRecipes,
    equipment: {
      ...initialPlayer.equipment,
      ...savedPlayer?.equipment,
    },
    techniques: savedPlayer?.techniques ?? initialPlayer.techniques,
    skills: {
      ...initialPlayer.skills,
      ...savedPlayer?.skills,
    },
    skillPractice: {
      ...initialPlayer.skillPractice,
      ...savedPlayer?.skillPractice,
    },
    elementalEssence: {
      ...initialPlayer.elementalEssence,
      ...savedPlayer?.elementalEssence,
    },
    constitutions: savedPlayer?.constitutions ?? initialPlayer.constitutions,
    techniqueMastery: {
      ...initialPlayer.techniqueMastery,
      ...savedPlayer?.techniqueMastery,
    },
    quests: savedQuests ?? initialPlayer.quests,
    npcJournal: {
      ...initialPlayer.npcJournal,
      ...savedPlayer?.npcJournal,
    },
    relationships: {
      ...initialPlayer.relationships,
      ...savedPlayer?.relationships,
    },
    reputation: {
      ...initialPlayer.reputation,
      ...savedPlayer?.reputation,
    },
    morality: {
      ...initialPlayer.morality,
      ...savedPlayer?.morality,
    },
    sectContribution: {
      ...initialPlayer.sectContribution,
      ...savedPlayer?.sectContribution,
    },
    corruption: savedPlayer?.corruption ?? initialPlayer.corruption,
    flags: {
      ...initialPlayer.flags,
      ...savedPlayer?.flags,
    },
  };
}
