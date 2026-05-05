import type { Scene } from "./types";

export function getSceneById(scenes: Scene[], sceneId: string): Scene {
  const scene = scenes.find((candidate) => candidate.id === sceneId);

  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  return scene;
}
