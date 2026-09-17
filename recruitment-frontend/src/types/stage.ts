// תואם ל-Stage ו-Criterion של הבאקאנד (קבוצה א׳)

export type CriterionType = "BOOLEAN" | "SCORED";
export type ScoringMethod = "RATIO" | "DIRECT";

export interface Stage {
  _id: string;
  positionId: string;
  name: string;
  order?: number;
  weightPercent?: number;
  quota?: number;
}

export interface Criterion {
  _id: string;
  stageId: string;
  name: string;
  type: CriterionType;
  scoringMethod?: ScoringMethod;
  targetValue?: number;
  weightPercent?: number;
  maxScore?: number;
  descriptionGuide?: string;
}

export const CRITERION_TYPE_LABELS: Record<CriterionType, string> = {
  BOOLEAN: "תנאי סף",
  SCORED: "מנוקד",
};

export const SCORING_METHOD_LABELS: Record<ScoringMethod, string> = {
  RATIO: "יחס מול ערך יעד",
  DIRECT: "ציון ישיר",
};
