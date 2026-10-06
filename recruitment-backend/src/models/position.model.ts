import { Schema } from "mongoose";
import { MAX_MONTHLY_HOURS } from "../constants";
import { Position } from "../types";
import { defineEntity } from "./defineEntity";

export const { Model: PositionModel, repository: positionRepository } =
  defineEntity<Position>("Position", {
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "JobCategory" },
    clusterCode: String,
    roleCode: String,
    level: { type: String, enum: ["LEVEL_A", "LEVEL_B", "LEVEL_C", "LEVEL_D"] },
    description: String,
    monthlyHours: {
      type: Number,
      max: [MAX_MONTHLY_HOURS, `היקף שעות חודשי לא יכול לעלות על ${MAX_MONTHLY_HOURS}`],
    },
    maxHourlyRate: Number,
    durationMonths: Number,
    status: {
      type: String,
      enum: ["DRAFT", "IN_EVALUATION", "APPROVED_FOR_TENDER", "CLOSED"],
      default: "DRAFT",
    },
    submissionDeadline: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  });
