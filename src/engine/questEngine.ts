import type { Player } from "./types";

export function startQuest(player: Player, questId: string): Player {
  if (player.quests[questId]) {
    return player;
  }

  return {
    ...player,
    quests: {
      ...player.quests,
      [questId]: {
        status: "active",
        step: 0,
      },
    },
  };
}

export function updateQuest(player: Player, questId: string, step: number): Player {
  const existingQuest = player.quests[questId];

  if (!existingQuest || existingQuest.status !== "active") {
    return player;
  }

  return {
    ...player,
    quests: {
      ...player.quests,
      [questId]: {
        ...existingQuest,
        step: Math.max(existingQuest.step, step),
      },
    },
  };
}

export function completeQuest(player: Player, questId: string): Player {
  const existingQuest = player.quests[questId];

  if (!existingQuest || existingQuest.status === "completed") {
    return player;
  }

  return {
    ...player,
    quests: {
      ...player.quests,
      [questId]: {
        ...existingQuest,
        status: "completed",
      },
    },
  };
}

export function failQuest(player: Player, questId: string): Player {
  const existingQuest = player.quests[questId];

  if (!existingQuest || existingQuest.status !== "active") {
    return player;
  }

  return {
    ...player,
    quests: {
      ...player.quests,
      [questId]: {
        ...existingQuest,
        status: "failed",
      },
    },
  };
}
