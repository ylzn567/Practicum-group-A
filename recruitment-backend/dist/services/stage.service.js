"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStageCascade = deleteStageCascade;
const stage_model_1 = require("../models/stage.model");
const criterion_model_1 = require("../models/criterion.model");
/** מחיקת שלב + הקריטריונים שלו, כדי לא להשאיר קריטריונים יתומים */
async function deleteStageCascade(stageId) {
    const result = await criterion_model_1.CriterionModel.deleteMany({ stageId });
    await stage_model_1.stageRepository.remove(stageId);
    return { criteriaDeleted: result.deletedCount ?? 0 };
}
