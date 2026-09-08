import { Schema, model } from "mongoose";
import { Stage } from "../types";
import { Repository } from "../repositories/generic.repository";

const stageSchema = new Schema<Stage>(
  {
    positionId: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    name: { type: String, required: true },
    order: Number,
    weightPercent: Number,
    quota: Number,
  },
  { timestamps: true }
);

export const StageModel = model<Stage>("Stage", stageSchema);
export const stageRepository = new Repository<Stage>(StageModel);
