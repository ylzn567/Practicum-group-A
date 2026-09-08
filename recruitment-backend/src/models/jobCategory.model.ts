import { Schema, model } from "mongoose";
import { JobCategory } from "../types";
import { Repository } from "../repositories/generic.repository";

// תבנית קריטריון מוטמעת (מועתקת למשרה חדשה מאותה קטגוריה)
const criterionTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["BOOLEAN", "SCORED"], required: true },
    scoringMethod: { type: String, enum: ["RATIO", "DIRECT"] },
    targetValue: Number,
    weightPercent: Number,
    maxScore: Number,
    descriptionGuide: String,
  },
  { _id: false }
);

// תבנית שלב מוטמעת
const stageTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    order: Number,
    weightPercent: Number,
    quota: Number,
    criteria: [criterionTemplateSchema],
  },
  { _id: false }
);

const jobCategorySchema = new Schema<JobCategory>(
  {
    name: { type: String, required: true },
    description: String,
    stageTemplates: [stageTemplateSchema],
  },
  { timestamps: true }
);

export const JobCategoryModel = model<JobCategory>(
  "JobCategory",
  jobCategorySchema
);
export const jobCategoryRepository = new Repository<JobCategory>(
  JobCategoryModel
);
