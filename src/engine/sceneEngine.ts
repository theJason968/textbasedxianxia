import type { Scene, SceneArea, SceneImage } from "./types";

export function getSceneById(scenes: Scene[], sceneId: string): Scene {
  const scene = scenes.find((candidate) => candidate.id === sceneId);

  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  return scene;
}

export function getSceneAreaById(
  areas: SceneArea[],
  areaId: string | undefined,
): SceneArea | undefined {
  if (!areaId) {
    return undefined;
  }

  return areas.find((area) => area.id === areaId);
}

export function getResolvedSceneImage(
  scene: Scene,
  area: SceneArea | undefined,
): SceneImage | undefined {
  return scene.image ?? area?.image;
}
