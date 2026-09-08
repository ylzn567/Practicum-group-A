import { Types } from "mongoose";

// ===== קבוצה א׳: Position · JobCategory · Stage · Criterion · Company =====

export type PositionLevel = "LEVEL_A" | "LEVEL_C" | "LEVEL_D";

export type PositionStatus =
  | "DRAFT"
  | "IN_EVALUATION"
  | "APPROVED_FOR_TENDER"
  | "CLOSED";

export interface Position {
  title: string;
  categoryId?: Types.ObjectId; // ref: JobCategory
  clusterCode?: string;
  roleCode?: string;
  level?: PositionLevel;
  description?: string;
  monthlyHours?: number;
  maxHourlyRate?: number;
  durationMonths?: number;
  status?: PositionStatus;
  submissionDeadline?: Date;
  createdBy?: Types.ObjectId; // ref: User (קבוצה ג׳)
}

// שלב + קריטריון לדוגמה שמוטמעים בתוך קטגוריית משרה (תבנית)
export interface CriterionTemplate {
  name: string;
  type: CriterionType;
  scoringMethod?: ScoringMethod;
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

export interface StageTemplate {
  name: string;
  order?: number;
  weightPercent?: number;
  quota?: number;
  criteria?: CriterionTemplate[];
}

export interface JobCategory {
  name: string;
  description?: string;
  stageTemplates?: StageTemplate[];
}

export interface Stage {
  positionId: Types.ObjectId; // ref: Position
  name: string;
  order?: number;
  weightPercent?: number;
  quota?: number;
}

export type CriterionType = "BOOLEAN" | "SCORED";
export type ScoringMethod = "RATIO" | "DIRECT";

export interface Criterion {
  stageId: Types.ObjectId; // ref: Stage
  name: string;
  type: CriterionType;
  scoringMethod?: ScoringMethod;
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

export interface Company {
  name: string;
  companyIdNumber?: string;
  contactEmail?: string;
}
