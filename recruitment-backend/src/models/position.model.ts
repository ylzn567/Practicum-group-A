import { Schema, model } from "mongoose";
import { Position } from "../types";
import { Repository } from "../repositories/generic.repository";

const positionSchema = new Schema<Position>(
  {
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "JobCategory" },
    clusterCode: String,
    roleCode: String,
    level: { type: String, enum: ["LEVEL_A", "LEVEL_C", "LEVEL_D"] },
    description: String,
    monthlyHours: Number,
    maxHourlyRate: Number,
    durationMonths: Number,
    status: {
      type: String,
      enum: ["DRAFT", "IN_EVALUATION", "APPROVED_FOR_TENDER", "CLOSED"],
      default: "DRAFT",
    },
    submissionDeadline: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PositionModel = model<Position>("Position", positionSchema);
export const positionRepository = new Repository<Position>(PositionModel);
