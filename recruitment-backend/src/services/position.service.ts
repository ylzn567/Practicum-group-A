import { Types } from "mongoose";
import { MAX_MONTHLY_HOURS } from "../constants";
import { BadRequestError } from "../middleware/errorHandler";
import { criterionFields, CriterionModel } from "../models/criterion.model";
import { jobCategoryRepository } from "../models/jobCategory.model";
import { positionRepository } from "../models/position.model";
import { stageFields, StageModel } from "../models/stage.model";
import { JobCategory, Position } from "../types";
import { assertPositionDeletable, assertPositionUpdate } from "./positionWorkflow";

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
 * משרה חדשה תמיד מתחילה כטיוטה, ומשם מתקדמת רק לפי מעברי הסטטוס המותרים.
 */
export async function createPositionWithTemplate(data: Partial<Position>): Promise<Position> {
  if (data.monthlyHours !== undefined && data.monthlyHours > MAX_MONTHLY_HOURS) {
    throw new BadRequestError(`היקף שעות חודשי לא יכול לעלות על ${MAX_MONTHLY_HOURS}`);
  }
  const position = await positionRepository.add({ ...data, status: "DRAFT" });

  const category = data.categoryId && (await jobCategoryRepository.getById(String(data.categoryId)));
  if (category) {
    await copyTemplateToPosition((position as Position & { _id: Types.ObjectId })._id, category);
  }
  return position;
}

/** עדכון משרה, כולל מעבר סטטוס. מה שמותר תלוי בסטטוס הנוכחי (positionWorkflow) */
export async function updatePosition(
  positionId: string,
  changes: Partial<Position>
): Promise<Position | null> {
  const current = await positionRepository.getById(positionId);
  if (!current) return null;
  assertPositionUpdate(current, changes);
  return positionRepository.update(positionId, changes);
}

/** מחיקה מהממשק: רק לפני הפרסום. ממשרה שפורסמה יוצאים בביטול */
export async function deletePosition(positionId: string): Promise<void> {
  const current = await positionRepository.getById(positionId);
  if (current) assertPositionDeletable(current);
  await deletePositionCascade(positionId);
}

/** מחיקת משרה + כל השלבים והקריטריונים שלה, כדי לא להשאיר מסמכים יתומים */
export async function deletePositionCascade(positionId: string): Promise<void> {
  const stages = await StageModel.find({ positionId });
  await CriterionModel.deleteMany({ stageId: { $in: stages.map((stage) => stage._id) } });
  await StageModel.deleteMany({ positionId });
  await positionRepository.remove(positionId);
}
