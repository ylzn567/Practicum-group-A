"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criterionRepository = exports.CriterionModel = void 0;
const mongoose_1 = require("mongoose");
const generic_repository_1 = require("../repositories/generic.repository");
const criterionSchema = new mongoose_1.Schema({
    stageId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stage", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["BOOLEAN", "SCORED"], required: true },
    scoringMethod: { type: String, enum: ["RATIO", "DIRECT"] },
    targetValue: Number,
    weightPercent: Number,
    maxScore: Number,
    descriptionGuide: String,
}, { timestamps: true });
exports.CriterionModel = (0, mongoose_1.model)("Criterion", criterionSchema);
exports.criterionRepository = new generic_repository_1.Repository(exports.CriterionModel);
