import type {
  ElementalEssence,
  Enemy,
  GameState,
  Player,
  PostCombatAlignment,
  PostCombatChoiceId,
} from "./types";

export type PostCombatChoice = {
  id: PostCombatChoiceId;
  label: string;
  description: string;
  alignment: PostCombatAlignment;
  requiresNote?: string;
  available: boolean;
};

function speechStat(player: Player): number {
  return Math.max(player.intelligence, player.perception);
}

function rollCheck(stat: number, difficulty: number): boolean {
  const playerRoll = stat + Math.floor(Math.random() * 11);
  const diffRoll = difficulty + Math.floor(Math.random() * 9);
  return playerRoll >= diffRoll;
}

function hasDarkConstitution(player: Player): boolean {
  return player.constitutions.some(
    (c) =>
      c.includes("shadow") ||
      c.includes("void") ||
      c.includes("death") ||
      c.includes("corpse") ||
      c.includes("yin"),
  );
}

const enemyElementMap: Record<string, ElementalEssence> = {
  mist_wolf: "Water",
  cloud_stag: "Wind",
  shadow_viper: "Fire",
  stone_crab: "Earth",
  mist_shade: "Water",
  bone_hound: "Earth",
  corrupt_outer_disciple: "Fire",
  black_thread_cultist: "Lightning",
  spirit_boar: "Earth",
};

export function getPostCombatChoices(
  player: Player,
  enemy: Enemy,
): PostCombatChoice[] {
  const type = enemy.postCombatType ?? (enemy.cultivation ? "cultivator" : "beast");
  const isBeastOrSpirit = type === "beast" || type === "spirit";
  const canSpeak = !isBeastOrSpirit;
  const hasCultivation = !!enemy.cultivation;
  const speech = speechStat(player);
  const difficulty = enemy.speechDifficulty ?? 12;
  const canInterrogate = canSpeak && speech >= difficulty - 5;
  const darkEnough = player.corruption >= 15 || player.willpower >= 20;
  const canAbsorb = hasDarkConstitution(player);

  const choices: PostCombatChoice[] = [];

  // ── Spare ──────────────────────────────────────────────────
  choices.push({
    id: "spare",
    label: isBeastOrSpirit ? "Drive it off" : "Spare them",
    description: isBeastOrSpirit
      ? "Let the creature withdraw. Spirit beasts remember those who show restraint."
      : "Let them go. They leave with their life; you leave with your karma intact.",
    alignment: "light",
    available: true,
  });

  // ── Blood Oath (cultivators only) ──────────────────────────
  if (type === "cultivator" && hasCultivation) {
    choices.push({
      id: "spare_oath",
      label: "Demand a Blood Oath",
      description:
        "Force them to swear on their cultivation not to oppose you. A broken oath invites qi deviation — they know the cost.",
      alignment: "neutral",
      available: true,
    });
  }

  // ── Interrogate then spare ─────────────────────────────────
  if (canSpeak && enemy.secretStash) {
    choices.push({
      id: "interrogate_spare",
      label: "Question them, then spare",
      description: `Pressure them for what they know, then release them. Requires wit. (${speech} vs difficulty ${difficulty})`,
      alignment: "light",
      requiresNote: !canInterrogate
        ? `Needs ${difficulty - 5} intelligence or perception (you have ${speech})`
        : undefined,
      available: canInterrogate,
    });
  }

  // ── Interrogate then kill ──────────────────────────────────
  if (canSpeak) {
    choices.push({
      id: "interrogate_kill",
      label: "Question them, then execute",
      description:
        "Extract everything they know — cache, contacts, plans — and leave nothing standing. Full information and full loot.",
      alignment: "dark",
      requiresNote: !darkEnough
        ? "Requires 15 corruption or 20 willpower"
        : undefined,
      available: darkEnough,
    });
  }

  // ── Kill ───────────────────────────────────────────────────
  choices.push({
    id: "kill",
    label: "Finish them",
    description: isBeastOrSpirit
      ? "End the creature. Take what it carries."
      : "End it. Take what they carry.",
    alignment: "neutral",
    available: true,
  });

  // ── Harvest qi (cultivators only — beasts/spirits have no pathways to drain) ──
  if (hasCultivation && !isBeastOrSpirit) {
    choices.push({
      id: "kill_harvest_qi",
      label: "Harvest their cultivation qi",
      description:
        "Drain their spiritual pathways before the qi dissipates. Raw and unrefined — it carries impurity with it.",
      alignment: "dark",
      available: true,
    });
  }

  // ── Claim technique ───────────────────────────────────────
  if (enemy.teachableTechnique) {
    choices.push({
      id: "kill_take_technique",
      label: "Claim their technique",
      description:
        "Search for their technique and attempt to grasp its principle. Comprehension determines whether the method translates.",
      alignment: "neutral",
      available: true,
    });
  }

  // ── Strip cultivation ─────────────────────────────────────
  if (hasCultivation && type === "cultivator") {
    const canStrip = player.spiritualSense >= 30;
    choices.push({
      id: "strip_cultivation",
      label: "Strip their cultivation",
      description:
        "Reach into their spiritual pathways with your sense and pull the elemental essence free. Crippling. Permanent. Corrupting.",
      alignment: "dark",
      requiresNote: !canStrip
        ? `Requires 30 spiritual sense (you have ${player.spiritualSense})`
        : undefined,
      available: canStrip,
    });
  }

  // ── Defile spirit core (cultivators only) ────────────────
  if (hasCultivation && !isBeastOrSpirit) {
    const canDefile = player.corruption >= 20;
    choices.push({
      id: "kill_defile",
      label: "Defile their spirit core",
      description:
        "Consume their core through corrupt means. Massive cultivation gain. Massive corruption. Something registers this as wrong — not your mind, something deeper.",
      alignment: "dark",
      requiresNote: !canDefile
        ? `Requires 20 corruption (you have ${player.corruption})`
        : undefined,
      available: canDefile,
    });
  }

  // ── Absorb death qi ───────────────────────────────────────
  if (canAbsorb) {
    choices.push({
      id: "absorb_death_qi",
      label: "Absorb their death qi",
      description:
        "Your constitution stirs as their life disperses. The death qi flows inward — dark and cold, nourishing the way rot nourishes soil.",
      alignment: "dark",
      available: true,
    });
  }

  // ── Leave ─────────────────────────────────────────────────
  choices.push({
    id: "leave",
    label: "Walk away",
    description: "Take nothing. Touch nothing. Leave the way you came.",
    alignment: "neutral",
    available: true,
  });

  return choices;
}

export function resolvePostCombatChoice(
  gameState: GameState,
  enemy: Enemy,
  choiceId: PostCombatChoiceId,
): GameState {
  const player = gameState.player;
  const combat = gameState.combat!;
  const baseRewards = combat.rewards ?? { spiritStones: 0, qi: 0, items: [] };
  const type = enemy.postCombatType ?? (enemy.cultivation ? "cultivator" : "beast");
  const isBeastOrSpirit = type === "beast" || type === "spirit";

  let newPlayer = { ...player };
  const messages: string[] = [];
  let rewardedStones = 0;
  let rewardedItems: string[] = [];

  switch (choiceId) {
    case "spare": {
      if (isBeastOrSpirit) {
        messages.push(
          "The creature reads that the fight is finished. It withdraws slowly, watching you as it goes.",
        );
        if (Math.random() < 0.3) {
          messages.push(
            "Something in its posture was not fear. You file this away.",
          );
        }
      } else {
        messages.push(
          "They rise slowly. They do not say anything. You watch until they are out of sight.",
        );
        messages.push("Some debts are paid in silence.");
      }
      newPlayer = { ...newPlayer, karma: player.karma + 3 };
      break;
    }

    case "spare_oath": {
      messages.push(
        "You hold them in place with your intent and state the terms plainly. The silence stretches. Then they begin.",
      );
      messages.push(
        "The blood oath qi-thread seals with a sharp pulse — they flinch as it takes hold in their meridians. They know what a broken oath costs a cultivator.",
      );
      messages.push("They will not oppose you again.");
      newPlayer = {
        ...newPlayer,
        karma: player.karma + 2,
        flags: {
          ...player.flags,
          [`oath_${enemy.id}`]: true,
          [`spared_${enemy.id}`]: true,
        },
      };
      break;
    }

    case "interrogate_spare": {
      const speech = speechStat(player);
      const difficulty = enemy.speechDifficulty ?? 12;
      const passed = rollCheck(speech, difficulty);

      if (passed) {
        messages.push(
          "Under your questioning they give way. The information comes reluctantly — location, what was hidden, and why.",
        );
        const stash = enemy.secretStash;
        if (stash?.spiritStones) {
          rewardedStones = stash.spiritStones;
          newPlayer = {
            ...newPlayer,
            spiritStones: player.spiritStones + stash.spiritStones,
          };
          messages.push(`You recover the stash: +${stash.spiritStones} spirit stones.`);
        }
        if (stash?.itemRewards?.length) {
          rewardedItems = [...new Set(stash.itemRewards)];
          newPlayer = {
            ...newPlayer,
            inventory: [...new Set([...player.inventory, ...rewardedItems])],
          };
          messages.push("You retrieve what was cached.");
        }
        messages.push("You release them after. They leave quickly and do not look back.");
        newPlayer = { ...newPlayer, karma: player.karma + 1 };
      } else {
        messages.push(
          "Nothing useful comes through. Whether it is loyalty, pride, or genuine ignorance — the interrogation produces nothing.",
        );
        messages.push("You spare them anyway. The choice still meant something.");
        newPlayer = { ...newPlayer, karma: player.karma + 2 };
      }
      break;
    }

    case "interrogate_kill": {
      const speech = speechStat(player);
      const difficulty = enemy.speechDifficulty ?? 12;
      const passed = rollCheck(speech, difficulty);

      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
        karma: player.karma - 4,
        corruption: player.corruption + 3,
      };

      if (passed) {
        messages.push(
          "Under enough pressure they give everything — cache location, contacts, what they were sent to do.",
        );
        const stash = enemy.secretStash;
        if (stash?.spiritStones) {
          rewardedStones += stash.spiritStones;
          newPlayer = {
            ...newPlayer,
            spiritStones: newPlayer.spiritStones + stash.spiritStones,
          };
          messages.push(`+${stash.spiritStones} spirit stones from the hidden cache.`);
        }
        if (stash?.itemRewards?.length) {
          const stashItems = [...new Set(stash.itemRewards)];
          rewardedItems = [...new Set([...rewardedItems, ...stashItems])];
          newPlayer = {
            ...newPlayer,
            inventory: [...new Set([...newPlayer.inventory, ...stashItems])],
          };
          messages.push("You retrieve the cached goods.");
        }
      } else {
        messages.push(
          "They say nothing before the end. Whatever they knew dies with them.",
        );
      }

      messages.push(
        "You take what they carry and do not linger. This kind of efficiency has a cost that compounds.",
      );
      break;
    }

    case "kill": {
      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
      };
      if (isBeastOrSpirit) {
        messages.push(
          "You take what the creature carried — cores, materials, whatever is worth keeping.",
        );
      } else {
        messages.push(
          "You search the body quickly and take what they had. Then you move on.",
        );
      }
      break;
    }

    case "kill_harvest_qi": {
      const harvestedQi = Math.min(
        player.maxQi - player.qi,
        Math.floor((enemy.qiReward ?? 2) * 1.6),
      );
      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
        qi: Math.min(player.maxQi, player.qi + harvestedQi),
        impurity: player.impurity + 5,
        karma: player.karma - 2,
        corruption: player.corruption + 2,
      };
      messages.push(
        "You draw their spiritual energy through your meridians before it disperses. Raw and unrefined — your pathways register the impurity the moment it settles.",
      );
      messages.push(`+${harvestedQi} qi absorbed. +5 impurity.`);
      break;
    }

    case "kill_take_technique": {
      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
      };
      if (enemy.teachableTechnique) {
        const techniqueId = enemy.teachableTechnique;
        if (player.techniques.includes(techniqueId)) {
          messages.push(
            "You find their scroll. You already know this method — reading it again sharpens a few details.",
          );
          newPlayer = {
            ...newPlayer,
            cultivationInsight: player.cultivationInsight + 1,
          };
        } else if (rollCheck(player.comprehension, 18)) {
          messages.push(
            "You find the scroll and sit with it long enough that the core principle takes hold. The method is yours.",
          );
          newPlayer = {
            ...newPlayer,
            techniques: [...player.techniques, techniqueId],
          };
        } else {
          const scrollId = `${techniqueId}_scroll`;
          messages.push(
            "You find the scroll but the qi-language defeats you. You take it anyway — understanding may come later.",
          );
          newPlayer = {
            ...newPlayer,
            inventory: [...new Set([...newPlayer.inventory, scrollId])],
          };
          rewardedItems = [...new Set([...rewardedItems, scrollId])];
        }
      }
      break;
    }

    case "kill_defile": {
      const defileQi = Math.min(player.maxQi - player.qi, 15);
      rewardedStones = (baseRewards.spiritStones ?? 0) * 2;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        qi: Math.min(player.maxQi, player.qi + defileQi),
        spiritStones: player.spiritStones + rewardedStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
        karma: player.karma - 8,
        corruption: player.corruption + 8,
        impurity: player.impurity + 6,
      };
      messages.push(
        "The corrupt method takes hold. Their spirit core dissolves into your pathways — a brutal absorption your meridians were not shaped for.",
      );
      messages.push(
        `+${defileQi} qi. +6 impurity. +8 corruption. Spirit stones doubled from the shattered core.`,
      );
      messages.push(
        "Something registers this as wrong — not your mind, something deeper and older. You note it and move on.",
      );
      break;
    }

    case "strip_cultivation": {
      const essenceCount = Math.floor(Math.random() * 3) + 1;
      const element = enemyElementMap[enemy.id] ?? null;
      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
        karma: player.karma - 5,
        corruption: player.corruption + 5,
        impurity: player.impurity + 3,
      };
      if (element) {
        newPlayer = {
          ...newPlayer,
          elementalEssence: {
            ...player.elementalEssence,
            [element]: (player.elementalEssence[element] ?? 0) + essenceCount,
          },
        };
        messages.push(
          `Your spiritual sense reaches into their pathways. The cultivation dissolves — ${essenceCount} ${element} essence absorbed into your meridians.`,
        );
      } else {
        messages.push(
          "Your spiritual sense reaches in. The pathways are too foreign to extract cleanly — you pull fragments.",
        );
      }
      messages.push("Their cultivation is gone. +3 impurity. +5 corruption.");
      break;
    }

    case "absorb_death_qi": {
      const absorbedQi = Math.floor(Math.random() * 5) + 2;
      rewardedStones = baseRewards.spiritStones;
      rewardedItems = [...baseRewards.items];
      newPlayer = {
        ...newPlayer,
        spiritStones: player.spiritStones + baseRewards.spiritStones,
        inventory: [...new Set([...player.inventory, ...baseRewards.items])],
        qi: Math.min(player.maxQi, player.qi + absorbedQi),
        impurity: player.impurity + 2,
        karma: player.karma - 2,
      };
      messages.push(
        "Your constitution stirs as their life energy disperses. The death qi flows inward through your meridians — dark and cold, but nourishing the way rot nourishes soil.",
      );
      messages.push(`+${absorbedQi} qi. +2 impurity.`);
      break;
    }

    case "leave": {
      messages.push(
        "You turn and walk away. What is left here belongs to the ground, not to you.",
      );
      break;
    }
  }

  return {
    ...gameState,
    player: newPlayer,
    combat: {
      ...combat,
      rewards: {
        spiritStones: rewardedStones,
        qi: combat.rewards?.qi ?? 0,
        items: rewardedItems,
      },
      postCombat: {
        stage: "result",
        choiceId,
        messages,
      },
    },
  };
}
