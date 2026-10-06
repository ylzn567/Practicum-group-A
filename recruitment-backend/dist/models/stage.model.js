"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stageRepository = exports.StageModel = void 0;
const mongoose_1 = require("mongoose");
const generic_repository_1 = require("../repositories/generic.repository");
const stageSchema = new mongoose_1.Schema({
    positionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Position",
        required: true,
    },
    name: { type: String, required: true },
    order: Number,
    weightPercent: Number,
    quota: Number,
}, { timestamps: true });
exports.StageModel = (0, mongoose_1.model)("Stage", stageSchema);
exports.stageRepository = new generic_repository_1.Repository(exports.StageModel);
