"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionRepository = exports.PositionModel = void 0;
const mongoose_1 = require("mongoose");
const generic_repository_1 = require("../repositories/generic.repository");
const positionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "JobCategory" },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.PositionModel = (0, mongoose_1.model)("Position", positionSchema);
exports.positionRepository = new generic_repository_1.Repository(exports.PositionModel);
