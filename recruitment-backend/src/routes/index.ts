import { Router } from "express";
import { createGenericRouter } from "./generic.router";

import { positionRepository } from "../models/position.model";
import { jobCategoryRepository } from "../models/jobCategory.model";
import { stageRepository } from "../models/stage.model";
import { criterionRepository } from "../models/criterion.model";
import { companyRepository } from "../models/company.model";

const router = Router();

// ===== קבוצה א׳ =====
// filterableFields מגדיר אילו פרמטרים מותרים ב-query string.
// שדה שלא מופיע כאן פשוט יתעלמו ממנו.
router.use(
  "/positions",
  createGenericRouter(positionRepository, {
    filterableFields: ["categoryId", "status", "level"],
  })
);
router.use("/job-categories", createGenericRouter(jobCategoryRepository));
router.use(
  "/stages",
  createGenericRouter(stageRepository, { filterableFields: ["positionId"] })
);
router.use(
  "/criteria",
  createGenericRouter(criterionRepository, {
    filterableFields: ["stageId", "type"],
  })
);
router.use("/companies", createGenericRouter(companyRepository));

// קבוצות ב׳/ג׳ יוסיפו כאן את הראוטים שלהן באותה צורה

export default router;
