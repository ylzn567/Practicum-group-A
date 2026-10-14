import { criterionRepository } from "../models/criterion.model";
import { Criterion } from "../types";
import { assertStageEditable } from "./positionWorkflow";

// קריטריונים הם משקלי הניקוד ותנאי הסף, ולכן ננעלים יחד עם המשרה

export async function createCriterion(data: Partial<Criterion>): Promise<Criterion> {
  await assertStageEditable(data.stageId);
  return criterionRepository.add(data);
}

export async function updateCriterion(
  criterionId: string,
  changes: Partial<Criterion>
): Promise<Criterion | null> {
  const criterion = await criterionRepository.getById(criterionId);
  if (!criterion) return null;
  await assertStageEditable(criterion.stageId);
  // העברת קריטריון לשלב אחר משנה גם אותו
  if (changes.stageId && String(changes.stageId) !== String(criterion.stageId)) {
    await assertStageEditable(changes.stageId);
  }
  return criterionRepository.update(criterionId, changes);
}

export async function deleteCriterion(criterionId: string): Promise<void> {
  const criterion = await criterionRepository.getById(criterionId);
  await assertStageEditable(criterion?.stageId);
  await criterionRepository.remove(criterionId);
}
