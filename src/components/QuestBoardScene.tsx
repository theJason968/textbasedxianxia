import { useState } from "react";
import { canChoose } from "../engine/conditionEngine";
import type { Choice, GameState, Scene } from "../engine/types";

interface Props {
  scene: Scene;
  gameState: GameState;
  onChoice: (choice: Choice) => void;
}

export function QuestBoardScene({ scene, gameState, onChoice }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const boardChoices = scene.choices.filter((c) => c.boardPosition);
  const leaveChoices = scene.choices.filter((c) => !c.boardPosition);

  function isQuestAlreadyTaken(choice: Choice): boolean {
    const questId = choice.effects?.startQuest;
    if (!questId) return false;
    const q = gameState.player.quests[questId];
    return q?.status === "active" || q?.status === "completed";
  }

  return (
    <div className="quest-board-wrapper">
      <div className="quest-board-container">
        <img
          src={scene.boardImage ?? "/assets/locations/quest_board.png"}
          alt="Assignment Hall Board"
          className="quest-board-bg"
          draggable={false}
        />

        {boardChoices.map((choice, i) => {
          const pos = choice.boardPosition!;
          const available = canChoose(gameState, choice);
          const taken = isQuestAlreadyTaken(choice);
          const isHovered = hoveredIndex === i;

          const paperClass = [
            "quest-paper",
            taken ? "quest-paper-taken" : "",
            !available && !taken ? "quest-paper-locked" : "",
            isHovered ? "quest-paper-hovered" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={choice.label}
              className={paperClass}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `rotate(${pos.rotation ?? 0}deg)`,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                if (available && !taken) onChoice(choice);
              }}
            >
              <div className="quest-paper-pin" />
              <span className="quest-paper-title">{choice.label}</span>
              {taken && <span className="quest-paper-stamp">Claimed</span>}

              {isHovered && (
                <div className="quest-paper-tooltip">
                  <strong>{choice.label}</strong>
                  {choice.boardDescription && <p>{choice.boardDescription}</p>}
                  {choice.boardReward && (
                    <small className="quest-paper-reward">
                      Reward: {choice.boardReward}
                    </small>
                  )}
                  {taken && (
                    <small className="quest-paper-taken-note">
                      Already accepted.
                    </small>
                  )}
                  {!available && !taken && (
                    <small className="quest-paper-locked-note">
                      Requirements not met.
                    </small>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="quest-board-actions">
        {leaveChoices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            onClick={() => onChoice(choice)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
