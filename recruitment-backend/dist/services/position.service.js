"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyTemplateToPosition = copyTemplateToPosition;
exports.createPositionWithTemplate = createPositionWithTemplate;
exports.deletePositionCascade = deletePositionCascade;
const position_model_1 = require("../models/position.model");
const jobCategory_model_1 = require("../models/jobCategory.model");
const stage_model_1 = require("../models/stage.model");
const criterion_model_1 = require("../models/criterion.model");
/** מעתיק את תבנית הקטגוריה לשלבים וקריטריונים אמיתיים של המשרה */
async function copyTemplateToPosition(positionId, category) {
    let stagesCreated = 0;
    let criteriaCreated = 0;
    for (const stageTemplate of category.stageTemplates ?? []) {
        const stage = await stage_model_1.StageModel.create({
            positionId,
            name: stageTemplate.name,
            order: stageTemplate.order,
            weightPercent: stageTemplate.weightPercent,
            quota: stageTemplate.quota,
        });
        stagesCreated += 1;
        const criteria = (stageTemplate.criteria ?? []).map((criterion) => ({
            stageId: stage._id,
            name: criterion.name,
            type: criterion.type,
            scoringMethod: criterion.scoringMethod,
            targetValue: criterion.targetValue,
            weightPercent: criterion.weightPercent,
            maxScore: criterion.maxScore,
            descriptionGuide: criterion.descriptionGuide,
        }));
        if (criteria.length > 0) {
            await criterion_model_1.CriterionModel.insertMany(criteria);
            criteriaCreated += criteria.length;
        }
    }
    return { stagesCreated, criteriaCreated };
}
/**
 * יצירת משרה + העתקת תבנית הקטגוריה שלה.
 * בלי categoryId, או כשלקטגוריה אין תבנית, המשרה נוצרת ריקה משלבים.
 */
async function createPositionWithTemplate(data) {
    const position = await position_model_1.positionRepository.add(data);
    const empty = { stagesCreated: 0, criteriaCreated: 0 };
    if (!data.categoryId)
        return { position, copied: empty };
    const category = await jobCategory_model_1.jobCategoryRepository.getById(String(data.categoryId));
    if (!category?.stageTemplates?.length)
        return { position, copied: empty };
    const positionId = position._id;
    const copied = await copyTemplateToPosition(positionId, category);
    return { position, copied };
}
/**
 * מחיקת משרה + כל השלבים והקריטריונים שלה.
 * מחיקה רגילה הייתה משאירה מסמכים יתומים ב-stages וב-criterions.
 */
async function deletePositionCascade(positionId) {
    const stages = await stage_model_1.StageModel.find({ positionId });
    const stageIds = stages.map((stage) => stage._id);
    const criteriaResult = await criterion_model_1.CriterionModel.deleteMany({
        stageId: { $in: stageIds },
    });
    const stagesResult = await stage_model_1.StageModel.deleteMany({ positionId });
    await position_model_1.positionRepository.remove(positionId);
    return {
        stagesDeleted: stagesResult.deletedCount ?? 0,
        criteriaDeleted: criteriaResult.deletedCount ?? 0,
    };
}
