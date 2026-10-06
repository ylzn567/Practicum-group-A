import { stageRepository } from "../models/stage.model";
import { CriterionModel } from "../models/criterion.model";

/** מחיקת שלב + הקריטריונים שלו, כדי לא להשאיר קריטריונים יתומים */
export async function deleteStageCascade(stageId: string): Promise<void> {
  await CriterionModel.deleteMany({ stageId });
  await stageRepository.remove(stageId);
}
