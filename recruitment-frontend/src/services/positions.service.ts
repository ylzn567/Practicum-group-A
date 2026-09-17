import { apiRequest } from "./api";
import type { Position } from "../types/position";

export function getPositions(): Promise<Position[]> {
  return apiRequest<Position[]>("/positions");
}

export function getPositionById(id: string): Promise<Position> {
  return apiRequest<Position>(`/positions/${id}`);
}

export function createPosition(data: Partial<Position>): Promise<Position> {
  return apiRequest<Position>("/positions", { method: "POST", body: data });
}

export function updatePosition(
  id: string,
  data: Partial<Position>
): Promise<Position> {
  return apiRequest<Position>(`/positions/${id}`, { method: "PUT", body: data });
}

export function deletePosition(id: string): Promise<void> {
  return apiRequest<void>(`/positions/${id}`, { method: "DELETE" });
}
