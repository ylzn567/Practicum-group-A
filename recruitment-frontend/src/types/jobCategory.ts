import type { Criterion, Stage } from "./stage";

/** תבנית מוטמעת בקטגוריה: אותם שדות כמו הישות האמיתית, בלי מזהים ובלי הפניה להורה */
export type CriterionTemplate = Omit<Criterion, "_id" | "stageId">;
export type StageTemplate = Omit<Stage, "_id" | "positionId"> & {
  criteria?: CriterionTemplate[];
};

export interface JobCategory {
  _id: string;
  name: string;
  description?: string;
  stageTemplates?: StageTemplate[];
}
