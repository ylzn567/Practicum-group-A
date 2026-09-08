import { Schema, model } from "mongoose";
import { Criterion } from "../types";
import { Repository } from "../repositories/generic.repository";

const criterionSchema = new Schema<Criterion>(
  {
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["BOOLEAN", "SCORED"], required: true },
    scoringMethod: { type: String, enum: ["RATIO", "DIRECT"] },
    targetValue: Number,
    weightPercent: Number,
    maxScore: Number,
    descriptionGuide: String,
  },
  { timestamps: true }
);

export const CriterionModel = model<Criterion>("Criterion", criterionSchema);
export const criterionRepository = new Repository<Criterion>(CriterionModel);
