import { Router } from "express";
import { createGenericRouter } from "./generic.router";

import { positionRepository } from "../models/position.model";
import { jobCategoryRepository } from "../models/jobCategory.model";
import { stageRepository } from "../models/stage.model";
import { criterionRepository } from "../models/criterion.model";
import { companyRepository } from "../models/company.model";

const router = Router();

// ===== קבוצה א׳ =====
router.use("/positions", createGenericRouter(positionRepository));
router.use("/job-categories", createGenericRouter(jobCategoryRepository));
router.use("/stages", createGenericRouter(stageRepository));
router.use("/criteria", createGenericRouter(criterionRepository));
router.use("/companies", createGenericRouter(companyRepository));

// קבוצות ב׳/ג׳ יוסיפו כאן את הראוטים שלהן באותה צורה

export default router;
