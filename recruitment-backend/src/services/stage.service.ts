import { stageRepository } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";
import { Stage } from "../types";
import { assertStagesEditable } from "./positionWorkflow";

// כל שינוי בשלב נבדק מול הסטטוס של המשרה: אחרי הפרסום השלבים נעולים

export async function createStage(data: Partial<Stage>): Promise<Stage> {
  await assertStagesEditable(data.positionId);
  return stageRepository.add(data);
}

export async function updateStage(stageId: string, changes: Partial<Stage>): Promise<Stage | null> {
  const stage = await stageRepository.getById(stageId);
  if (!stage) return null;
  await assertStagesEditable(stage.positionId);
  // העברת שלב למשרה אחרת משנה גם אותה
  if (changes.positionId && String(changes.positionId) !== String(stage.positionId)) {
    await assertStagesEditable(changes.positionId);
  }
  return stageRepository.update(stageId, changes);
}

/** מחיקת שלב + הקריטריונים שלו, כדי לא להשאיר קריטריונים יתומים */
export async function deleteStageCascade(stageId: string): Promise<void> {
  const stage = await stageRepository.getById(stageId);
  await assertStagesEditable(stage?.positionId);
  await CriterionModel.deleteMany({ stageId });
  await stageRepository.remove(stageId);
}
