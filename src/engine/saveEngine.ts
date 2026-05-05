import { createInitialGameState } from "./gameState";
import type { GameState, Player } from "./types";

const saveKey = "xianxia-text-adventure-save-v1";

export function saveGame(gameState: GameState): void {
  localStorage.setItem(saveKey, JSON.stringify(gameState));
}

export function loadGame(): GameState | null {
  const savedGame = localStorage.getItem(saveKey);

  if (!savedGame) {
    return null;
  }

  try {
    return mergeWithInitialState(JSON.parse(savedGame) as Partial<GameState>);
  } catch {
    clearSavedGame();
    return null;
  }
}

export function clearSavedGame(): void {
  localStorage.removeItem(saveKey);
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(saveKey) !== null;
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
    inventory: savedPlayer?.inventory ?? initialPlayer.inventory,
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
    flags: {
      ...initialPlayer.flags,
      ...savedPlayer?.flags,
    },
  };
}
