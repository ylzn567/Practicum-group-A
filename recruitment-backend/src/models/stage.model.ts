import { Schema } from "mongoose";
import { Stage } from "../types";
import { defineEntity } from "./defineEntity";

/** השדות של שלב, משותפים ל-Stage ולתבנית השלב שבתוך JobCategory */
export const stageFields = {
  name: { type: String, required: true },
  order: Number,
  weightPercent: Number,
  quota: Number,
};

export const { Model: StageModel, repository: stageRepository } =
  defineEntity<Stage>("Stage", {
    positionId: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    ...stageFields,
  });
