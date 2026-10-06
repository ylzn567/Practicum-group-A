import { Types } from "mongoose";
import { MAX_MONTHLY_HOURS } from "../constants";
import { BadRequestError } from "../middleware/errorHandler";
import { criterionFields, CriterionModel } from "../models/criterion.model";
import { jobCategoryRepository } from "../models/jobCategory.model";
import { positionRepository } from "../models/position.model";
import { stageFields, StageModel } from "../models/stage.model";
import { JobCategory, Position } from "../types";

/**
 * לוגיקה עסקית ייחודית, לא CRUD רגיל, ולכן פונקציה משלה
 * שמשתמשת ב-Repository הגנרי בפנים במקום לשכפל אותו.
 */

const STAGE_KEYS = Object.keys(stageFields);
const CRITERION_KEYS = Object.keys(criterionFields);

// העתקה מפורשת של שדות (לא spread), כי תבנית שנשלפה מהמסד היא מסמך mongoose
const pick = (source: object, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, (source as Record<string, unknown>)[key]]));

/** מעתיק את תבנית הקטגוריה לשלבים וקריטריונים אמיתיים של המשרה */
export async function copyTemplateToPosition(positionId: Types.ObjectId, category: JobCategory) {
  const templates = category.stageTemplates ?? [];
  let criteriaCreated = 0;

  for (const template of templates) {
    const stage = await StageModel.create({ ...pick(template, STAGE_KEYS), positionId });
    const criteria = (template.criteria ?? []).map((criterion) => ({
      ...pick(criterion, CRITERION_KEYS),
      stageId: stage._id,
    }));
    if (criteria.length > 0) await CriterionModel.insertMany(criteria);
    criteriaCreated += criteria.length;
  }

  return { stagesCreated: templates.length, criteriaCreated };
}

/**
 * יצירת משרה + העתקת תבנית הקטגוריה שלה.
 * בלי categoryId, או כשלקטגוריה אין תבנית, המשרה נוצרת ריקה משלבים.
 */
export async function createPositionWithTemplate(data: Partial<Position>): Promise<Position> {
  if (data.monthlyHours !== undefined && data.monthlyHours > MAX_MONTHLY_HOURS) {
    throw new BadRequestError(`היקף שעות חודשי לא יכול לעלות על ${MAX_MONTHLY_HOURS}`);
  }
  const position = await positionRepository.add(data);

  const category = data.categoryId && (await jobCategoryRepository.getById(String(data.categoryId)));
  if (category) {
    await copyTemplateToPosition((position as Position & { _id: Types.ObjectId })._id, category);
  }
  return position;
}

/** מחיקת משרה + כל השלבים והקריטריונים שלה, כדי לא להשאיר מסמכים יתומים */
export async function deletePositionCascade(positionId: string): Promise<void> {
  const stages = await StageModel.find({ positionId });
  await CriterionModel.deleteMany({ stageId: { $in: stages.map((stage) => stage._id) } });
  await StageModel.deleteMany({ positionId });
  await positionRepository.remove(positionId);
}
