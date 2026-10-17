import { Router } from "express";
import { createGenericRouter } from "./generic.router";
import positionsRouter from "./positions.router";

import { jobCategoryRepository } from "../models/jobCategory.model";
import { stageRepository } from "../models/stage.model";
import { criterionRepository } from "../models/criterion.model";
import { companyRepository } from "../models/company.model";
import { createCriterion, deleteCriterion, updateCriterion } from "../services/criterion.service";
import { createStage, deleteStageCascade, updateStage } from "../services/stage.service";

const router = Router();

// ===== קבוצה א׳ =====
// filterableFields / populatableFields מגדירים מה מותר ב-query string.
// create / update / remove דורסים את ההתנהגות הגנרית כשיש לוגיקה עסקית.
// בשלבים ובקריטריונים זו הנעילה לפי סטטוס המשרה.
router.use("/positions", positionsRouter);
router.use("/job-categories", createGenericRouter(jobCategoryRepository));
router.use(
  "/stages",
  createGenericRouter(stageRepository, {
    filterableFields: ["positionId"],
    populatableFields: ["positionId"],
    create: createStage,
    update: updateStage,
    remove: deleteStageCascade,
  })
);
router.use(
  "/criteria",
  createGenericRouter(criterionRepository, {
    filterableFields: ["stageId", "type"],
    populatableFields: ["stageId"],
    create: createCriterion,
    update: updateCriterion,
    remove: deleteCriterion,
  })
);
router.use("/companies", createGenericRouter(companyRepository));

// קבוצות ב׳/ג׳ יוסיפו כאן את הראוטים שלהן באותה צורה

export default router;
