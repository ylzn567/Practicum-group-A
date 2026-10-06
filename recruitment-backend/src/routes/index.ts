import { Router } from "express";
import { createGenericRouter } from "./generic.router";
import positionsRouter from "./positions.router";

import { jobCategoryRepository } from "../models/jobCategory.model";
import { stageRepository } from "../models/stage.model";
import { criterionRepository } from "../models/criterion.model";
import { companyRepository } from "../models/company.model";
import { deleteStageCascade } from "../services/stage.service";

const router = Router();

// ===== קבוצה א׳ =====
// filterableFields / populatableFields מגדירים מה מותר ב-query string.
// create / remove דורסים את ההתנהגות הגנרית כשיש לוגיקה עסקית.
router.use("/positions", positionsRouter);
router.use("/job-categories", createGenericRouter(jobCategoryRepository));
router.use(
  "/stages",
  createGenericRouter(stageRepository, {
    filterableFields: ["positionId"],
    populatableFields: ["positionId"],
    remove: deleteStageCascade,
  })
);
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
