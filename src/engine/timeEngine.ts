import type { Player, TimeOfDay } from "./types";

export const timeOfDayOrder: TimeOfDay[] = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

export function advancePlayerTime(player: Player, timeBlocks = 0): Player {
  if (timeBlocks <= 0) {
    return player;
  }

  const currentTimeIndex = Math.max(0, timeOfDayOrder.indexOf(player.timeOfDay));
  const totalTimeIndex = currentTimeIndex + timeBlocks;
  const daysAdvanced = Math.floor(totalTimeIndex / timeOfDayOrder.length);
  const nextTimeOfDay = timeOfDayOrder[totalTimeIndex % timeOfDayOrder.length];
  const examKnown = player.flags.learned_about_azure_cloud_exam === true;

  return {
    ...player,
    day: player.day + daysAdvanced,
    timeOfDay: nextTimeOfDay,
    daysRemainingToExam: examKnown
      ? Math.max(0, player.daysRemainingToExam - daysAdvanced)
      : player.daysRemainingToExam,
  };
}

export function formatCalendarTime(player: Player): string {
  return `Day ${player.day}, ${player.timeOfDay}`;
}
