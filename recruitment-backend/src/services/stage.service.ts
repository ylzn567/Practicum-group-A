import { stageRepository } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";

/** מחיקת שלב + הקריטריונים שלו, כדי לא להשאיר קריטריונים יתומים */
export async function deleteStageCascade(
  stageId: string
): Promise<{ criteriaDeleted: number }> {
  const result = await CriterionModel.deleteMany({ stageId });
  await stageRepository.remove(stageId);
  return { criteriaDeleted: result.deletedCount ?? 0 };
}
