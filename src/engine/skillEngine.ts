import skills from "../data/skills.json";
import type { Player, Skill, SkillEffects } from "./types";

const skillData = skills as Skill[];
const skillEffectKeys: Array<keyof SkillEffects> = ["combatDamage", "combatDefense"];
const skillLevelNames = ["Novice", "Intermediate", "Skilled", "Expert"] as const;
export const skillPracticesPerLevel = 3;

export function getSkillLevelName(rank: number): string {
  if (rank <= 0) {
    return "Untrained";
  }

  return skillLevelNames[Math.min(rank, skillLevelNames.length) - 1];
}

export function formatSkillLevel(rank: number, maxRank: number): string {
  return `${getSkillLevelName(rank)} ${rank}/${maxRank}`;
}

export function formatSkillPracticeProgress(
  rank: number,
  maxRank: number,
  practice: number,
): string {
  if (rank <= 0 || rank >= maxRank) {
    return "";
  }

  return `${practice}/${skillPracticesPerLevel} to ${getSkillLevelName(rank + 1)}`;
}

export function getSkillEffectTotals(player: Player): Required<SkillEffects> {
  return Object.entries(player.skills).reduce<Required<SkillEffects>>(
    (totals, [skillId, rank]) => {
      const skill = skillData.find((candidate) => candidate.id === skillId);

      if (!skill?.effects || rank <= 0) {
        return totals;
      }

      return skillEffectKeys.reduce<Required<SkillEffects>>(
        (nextTotals, key) => ({
          ...nextTotals,
          [key]: nextTotals[key] + (skill.effects?.[key] ?? 0) * rank,
        }),
        totals,
      );
    },
    {
      combatDamage: 0,
      combatDefense: 0,
    },
  );
}

export function formatSkillEffectSummary(skill: Skill, rank: number): string {
  if (!skill.effects || rank <= 0) {
    return "";
  }

  return skillEffectKeys
    .map((key) => {
      const value = (skill.effects?.[key] ?? 0) * rank;

      if (value === 0) {
        return null;
      }

      return `+${value} ${getSkillEffectLabel(key)}`;
    })
    .filter((summary) => summary !== null)
    .join(", ");
}

function getSkillEffectLabel(key: keyof SkillEffects): string {
  if (key === "combatDamage") {
    return "damage";
  }

  return "defense";
}
