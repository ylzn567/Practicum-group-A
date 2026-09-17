import type { CriterionType, ScoringMethod } from "./stage";

/**
 * תבנית קטגוריה — שלבים וקריטריונים מוטמעים בתוך מסמך אחד.
 * בניגוד ל-Stage ו-Criterion, שהם אוספים נפרדים ברמת המשרה.
 */
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
  _id: string;
  name: string;
  description?: string;
  stageTemplates?: StageTemplate[];
}
