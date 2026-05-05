import constitutions from "../data/constitutions.json";
import type { Constitution, ElementalEssence, Player } from "./types";

const constitutionData = constitutions as Constitution[];

export function awakenEligibleConstitutions(player: Player): Player {
  const awakenedConstitutions = constitutionData
    .filter((constitution) => !player.constitutions.includes(constitution.id))
    .filter((constitution) =>
      hasRequiredElements(player.elementalEssence, constitution.requiredElements),
    )
    .map((constitution) => constitution.id);

  if (awakenedConstitutions.length === 0) {
    return player;
  }

  return {
    ...player,
    constitutions: [...player.constitutions, ...awakenedConstitutions],
  };
}

export function getConstitutionName(constitutionId: string): string {
  return (
    constitutionData.find((constitution) => constitution.id === constitutionId)?.name ??
    constitutionId
  );
}

export function getElementLabel(element: ElementalEssence): string {
  return `${element} Essence`;
}

function hasRequiredElements(
  currentElements: Player["elementalEssence"],
  requiredElements: Constitution["requiredElements"],
): boolean {
  return Object.entries(requiredElements).every(
    ([element, requiredAmount]) =>
      (currentElements[element as ElementalEssence] ?? 0) >= requiredAmount,
  );
}
