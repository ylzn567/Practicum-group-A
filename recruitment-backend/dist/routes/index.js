"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generic_router_1 = require("./generic.router");
const positions_router_1 = __importDefault(require("./positions.router"));
const stages_router_1 = __importDefault(require("./stages.router"));
const jobCategory_model_1 = require("../models/jobCategory.model");
const criterion_model_1 = require("../models/criterion.model");
const company_model_1 = require("../models/company.model");
const router = (0, express_1.Router)();
// ===== קבוצה א׳ =====
// filterableFields מגדיר אילו פרמטרים מותרים ב-query string.
// שדה שלא מופיע כאן פשוט יתעלמו ממנו.
// למשרות יש ראוטר משלהן — יצירת משרה מעתיקה גם את תבנית הקטגוריה
router.use("/positions", positions_router_1.default);
router.use("/job-categories", (0, generic_router_1.createGenericRouter)(jobCategory_model_1.jobCategoryRepository));
// לשלבים יש ראוטר משלהם — מחיקת שלב מוחקת גם את הקריטריונים שלו
router.use("/stages", stages_router_1.default);
router.use("/criteria", (0, generic_router_1.createGenericRouter)(criterion_model_1.criterionRepository, {
    filterableFields: ["stageId", "type"],
    populatableFields: ["stageId"],
}));
router.use("/companies", (0, generic_router_1.createGenericRouter)(company_model_1.companyRepository));
// קבוצות ב׳/ג׳ יוסיפו כאן את הראוטים שלהן באותה צורה
exports.default = router;
