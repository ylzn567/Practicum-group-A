import { Types } from "mongoose";
import { positionRepository } from "../models/position.model";
import { jobCategoryRepository } from "../models/jobCategory.model";
import { StageModel } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";
import { JobCategory, Position } from "../types";

/**
 * לוגיקה עסקית ייחודית — לא CRUD רגיל, ולכן פונקציה משלה
 * שמשתמשת ב-Repository הגנרי בפנים במקום לשכפל אותו.
 */

export interface TemplateCopyResult {
  stagesCreated: number;
  criteriaCreated: number;
}

/** מעתיק את תבנית הקטגוריה לשלבים וקריטריונים אמיתיים של המשרה */
export async function copyTemplateToPosition(
  positionId: Types.ObjectId,
  category: JobCategory
): Promise<TemplateCopyResult> {
  let stagesCreated = 0;
  let criteriaCreated = 0;

  for (const stageTemplate of category.stageTemplates ?? []) {
    const stage = await StageModel.create({
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
      await CriterionModel.insertMany(criteria);
      criteriaCreated += criteria.length;
    }
  }

  return { stagesCreated, criteriaCreated };
}

/**
 * יצירת משרה + העתקת תבנית הקטגוריה שלה.
 * בלי categoryId, או כשלקטגוריה אין תבנית, המשרה נוצרת ריקה משלבים.
 */
export async function createPositionWithTemplate(
  data: Partial<Position>
): Promise<{ position: Position; copied: TemplateCopyResult }> {
  const position = await positionRepository.add(data);
  const empty: TemplateCopyResult = { stagesCreated: 0, criteriaCreated: 0 };

  if (!data.categoryId) return { position, copied: empty };

  const category = await jobCategoryRepository.getById(String(data.categoryId));
  if (!category?.stageTemplates?.length) return { position, copied: empty };

  const positionId = (position as Position & { _id: Types.ObjectId })._id;
  const copied = await copyTemplateToPosition(positionId, category);

  return { position, copied };
}

/**
 * מחיקת משרה + כל השלבים והקריטריונים שלה.
 * מחיקה רגילה הייתה משאירה מסמכים יתומים ב-stages וב-criterions.
 */
export async function deletePositionCascade(
  positionId: string
): Promise<{ stagesDeleted: number; criteriaDeleted: number }> {
  const stages = await StageModel.find({ positionId });
  const stageIds = stages.map((stage) => stage._id);

  const criteriaResult = await CriterionModel.deleteMany({
    stageId: { $in: stageIds },
  });
  const stagesResult = await StageModel.deleteMany({ positionId });
  await positionRepository.remove(positionId);

  return {
    stagesDeleted: stagesResult.deletedCount ?? 0,
    criteriaDeleted: criteriaResult.deletedCount ?? 0,
  };
}
