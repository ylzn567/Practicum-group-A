import { Router } from "express";
import { createGenericRouter } from "./generic.router";
import positionsRouter from "./positions.router";
import stagesRouter from "./stages.router";

import { jobCategoryRepository } from "../models/jobCategory.model";
import { criterionRepository } from "../models/criterion.model";
import { companyRepository } from "../models/company.model";

const router = Router();

// ===== קבוצה א׳ =====
// filterableFields מגדיר אילו פרמטרים מותרים ב-query string.
// שדה שלא מופיע כאן פשוט יתעלמו ממנו.
// למשרות יש ראוטר משלהן — יצירת משרה מעתיקה גם את תבנית הקטגוריה
router.use("/positions", positionsRouter);
router.use("/job-categories", createGenericRouter(jobCategoryRepository));
// לשלבים יש ראוטר משלהם — מחיקת שלב מוחקת גם את הקריטריונים שלו
router.use("/stages", stagesRouter);
router.use(
  "/criteria",
  createGenericRouter(criterionRepository, {
    filterableFields: ["stageId", "type"],
    populatableFields: ["stageId"],
  })
);
router.use("/companies", createGenericRouter(companyRepository));

// קבוצות ב׳/ג׳ יוסיפו כאן את הראוטים שלהן באותה צורה

export default router;
