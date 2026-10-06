import type { PositionLevel } from "./position";
import type { CriterionType, ScoringMethod } from "./stage";

// תואם ל-MapalDraft של הבאקאנד (mapalImport.service.ts)

export interface DraftCriterion {
  name: string;
  type: CriterionType;
  scoringMethod?: ScoringMethod;
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

export interface DraftStage {
  name: string;
  order: number;
  weightPercent: number;
  quota?: number;
  criteria: DraftCriterion[];
}

export interface MapalDraft {
  /** recruitment = קובץ שהמערכת ייצאה, office = קובץ מקורי של המשרד */
  format: "recruitment" | "office";
  title: string;
  level?: PositionLevel;
  stages: DraftStage[];
  warnings: string[];
}

export interface MapalImportRequest {
  title: string;
  categoryId?: string;
  level?: PositionLevel;
  stages: DraftStage[];
}
