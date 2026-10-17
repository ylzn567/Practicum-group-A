import type { Company } from "../types/company";
import type { JobCategory } from "../types/jobCategory";
import type { MapalDraft, MapalImportRequest } from "../types/mapalImport";
import type { Position } from "../types/position";
import type { Criterion, Stage } from "../types/stage";
import { apiRequest, downloadFile, uploadFile } from "./api";
import { createCrudService } from "./crud";

// ===== CRUD לכל אוסף של קבוצה א׳ =====
export const positionsApi = createCrudService<Position>("/positions");
export const stagesApi = createCrudService<Stage>("/stages");
export const criteriaApi = createCrudService<Criterion>("/criteria");
export const categoriesApi = createCrudService<JobCategory>("/job-categories");
export const companiesApi = createCrudService<Company>("/companies");

// ===== מפ"ל =====

/** מוריד את קובץ המפ"ל (Excel) של המשרה */
export const downloadMapal = (positionId: string, fileName: string) =>
  downloadFile(`/positions/${positionId}/mapal`, fileName);

/** שלב 1 של ייבוא: מנתח את הקובץ ומחזיר טיוטה, בלי ליצור כלום */
export const parseMapalFile = (file: File) =>
  uploadFile<MapalDraft>("/positions/import-mapal/parse", file);

/** שלב 2: יוצר משרה, שלבים וקריטריונים מהטיוטה שאושרה */
export const createPositionFromMapal = (data: MapalImportRequest) =>
  apiRequest<Position>("/positions/import-mapal", { method: "POST", body: data });

/** שלבי המשרה לפי סדר, והקריטריונים של כל שלב. העץ שמסכי המשרה והשלבים צריכים */
export async function getStageTree(positionId: string) {
  const stages = (await stagesApi.getAll({ positionId })).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const lists = await Promise.all(stages.map((stage) => criteriaApi.getAll({ stageId: stage._id })));
  const criteriaByStage: Record<string, Criterion[]> = Object.fromEntries(
    stages.map((stage, index) => [stage._id, lists[index]])
  );
  return { stages, criteriaByStage };
}
