import { Schema } from "mongoose";
import { JobCategory } from "../types";
import { criterionFields } from "./criterion.model";
import { defineEntity } from "./defineEntity";
import { stageFields } from "./stage.model";

// התבנית מוטמעת בתוך הקטגוריה ומועתקת למשרה חדשה, ולכן אין לה _id משלה.
// השדות זהים לשלב ולקריטריון האמיתיים (משותפים), רק בלי ההפניה להורה.
const stageTemplateSchema = new Schema(
  {
    ...stageFields,
    criteria: [new Schema(criterionFields, { _id: false })],
  },
  { _id: false }
);

export const { Model: JobCategoryModel, repository: jobCategoryRepository } =
  defineEntity<JobCategory>("JobCategory", {
    name: { type: String, required: true },
    description: String,
    stageTemplates: [stageTemplateSchema],
  });
