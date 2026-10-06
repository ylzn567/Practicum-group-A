import { apiRequest, downloadFile, uploadFile } from "./api";
import type { Position } from "../types/position";
import type { MapalDraft, MapalImportRequest } from "../types/mapalImport";

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

/** מוריד את קובץ המפ"ל (Excel) של המשרה */
export function downloadMapal(id: string, fileName: string): Promise<void> {
  return downloadFile(`/positions/${id}/mapal`, fileName);
}

/** שלב 1 של ייבוא מפ"ל: מנתח את הקובץ ומחזיר טיוטה, בלי ליצור כלום */
export function parseMapalFile(file: File): Promise<MapalDraft> {
  return uploadFile<MapalDraft>("/positions/import-mapal/parse", file);
}

/** שלב 2: יוצר משרה, שלבים וקריטריונים מהטיוטה שאושרה */
export function createPositionFromMapal(data: MapalImportRequest): Promise<Position> {
  return apiRequest<Position>("/positions/import-mapal", { method: "POST", body: data });
}
