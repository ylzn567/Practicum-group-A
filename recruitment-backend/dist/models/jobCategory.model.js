"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobCategoryRepository = exports.JobCategoryModel = void 0;
const mongoose_1 = require("mongoose");
const generic_repository_1 = require("../repositories/generic.repository");
// תבנית קריטריון מוטמעת (מועתקת למשרה חדשה מאותה קטגוריה)
const criterionTemplateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["BOOLEAN", "SCORED"], required: true },
    scoringMethod: { type: String, enum: ["RATIO", "DIRECT"] },
    targetValue: Number,
    weightPercent: Number,
    maxScore: Number,
    descriptionGuide: String,
}, { _id: false });
// תבנית שלב מוטמעת
const stageTemplateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    order: Number,
    weightPercent: Number,
    quota: Number,
    criteria: [criterionTemplateSchema],
}, { _id: false });
const jobCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    stageTemplates: [stageTemplateSchema],
}, { timestamps: true });
exports.JobCategoryModel = (0, mongoose_1.model)("JobCategory", jobCategorySchema);
exports.jobCategoryRepository = new generic_repository_1.Repository(exports.JobCategoryModel);
