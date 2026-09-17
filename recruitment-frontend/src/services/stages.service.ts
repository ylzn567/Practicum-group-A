import { apiRequest } from "./api";
import type { Criterion, Stage } from "../types/stage";

// ===== שלבים =====

export function getStagesByPosition(positionId: string): Promise<Stage[]> {
  return apiRequest<Stage[]>(`/stages?positionId=${encodeURIComponent(positionId)}`);
}

export function createStage(data: Partial<Stage>): Promise<Stage> {
  return apiRequest<Stage>("/stages", { method: "POST", body: data });
}

export function updateStage(id: string, data: Partial<Stage>): Promise<Stage> {
  return apiRequest<Stage>(`/stages/${id}`, { method: "PUT", body: data });
}

export function deleteStage(id: string): Promise<void> {
  return apiRequest<void>(`/stages/${id}`, { method: "DELETE" });
}

// ===== קריטריונים =====

export function getCriteriaByStage(stageId: string): Promise<Criterion[]> {
  return apiRequest<Criterion[]>(`/criteria?stageId=${encodeURIComponent(stageId)}`);
}

export function createCriterion(data: Partial<Criterion>): Promise<Criterion> {
  return apiRequest<Criterion>("/criteria", { method: "POST", body: data });
}

export function updateCriterion(
  id: string,
  data: Partial<Criterion>
): Promise<Criterion> {
  return apiRequest<Criterion>(`/criteria/${id}`, { method: "PUT", body: data });
}

export function deleteCriterion(id: string): Promise<void> {
  return apiRequest<void>(`/criteria/${id}`, { method: "DELETE" });
}
