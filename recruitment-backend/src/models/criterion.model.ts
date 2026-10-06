import { Schema } from "mongoose";
import { Criterion } from "../types";
import { defineEntity } from "./defineEntity";

/** השדות של קריטריון, משותפים ל-Criterion ולתבנית הקריטריון שבתוך JobCategory */
export const criterionFields = {
  name: { type: String, required: true },
  type: { type: String, enum: ["BOOLEAN", "SCORED"], required: true },
  scoringMethod: { type: String, enum: ["RATIO", "DIRECT"] },
  targetValue: Number,
  weightPercent: Number,
  maxScore: Number,
  descriptionGuide: String,
};

export const { Model: CriterionModel, repository: criterionRepository } =
  defineEntity<Criterion>("Criterion", {
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    ...criterionFields,
  });
