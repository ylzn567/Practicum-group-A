import type { JobCategory } from "../../types/jobCategory";
import { text } from "../../utils/validation";
import {
  EMPTY_STAGE_FORM,
  criterionToForm,
  criterionToPayload,
  hasScoredCriteria,
  stageToForm,
  stageToPayload,
  sumCriteriaWeights,
  sumStageWeights,
  validateCriterionForm,
  validateStageForm,
} from "../stages/stageForms";
import type { CriterionFormValues, StageFormValues } from "../stages/stageForms";

// תבנית קטגוריה בטופס: אותם טפסי שלב וקריטריון כמו בעורך השלבים של משרה, בהקשר מקונן

export interface StageTemplateForm {
  stage: StageFormValues;
  criteria: CriterionFormValues[];
}

export interface CategoryForm {
  name: string;
  description: string;
  stages: StageTemplateForm[];
}

export const EMPTY_CATEGORY: CategoryForm = { name: "", description: "", stages: [] };
export const EMPTY_STAGE_TEMPLATE: StageTemplateForm = { stage: EMPTY_STAGE_FORM, criteria: [] };

export const categoryToForm = (category: JobCategory): CategoryForm => ({
  name: category.name ?? "",
  description: category.description ?? "",
  stages: [...(category.stageTemplates ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((template) => ({
      stage: stageToForm(template),
      criteria: (template.criteria ?? []).map(criterionToForm),
    })),
});

/** order נגזר ממיקום ברשימה, ולכן אין צורך לנהל אותו ידנית */
export const categoryToPayload = (form: CategoryForm): Partial<JobCategory> => ({
  name: form.name.trim(),
  description: text(form.description),
  stageTemplates: form.stages.map(({ stage, criteria }, index) => ({
    ...stageToPayload(stage),
    order: index + 1,
    criteria: criteria.map(criterionToPayload),
  })),
});

/**
 * ולידציה של התבנית כולה, כרשימת בעיות קריאות. המבנה מקונן מדי למפת שגיאות לפי שדה,
 * והמחוונים החיים ממילא מראים את חוסר האיזון תוך כדי עבודה.
 */
export function validateCategory(form: CategoryForm): string[] {
  const problems: string[] = [];
  const report = (label: string, errors: Record<string, string | undefined>) =>
    Object.values(errors).forEach((message) => message && problems.push(`${label}: ${message}`));

  if (form.name.trim().length < 2) problems.push("יש להזין שם לקטגוריה");
  if (form.stages.length === 0) problems.push("יש להגדיר לפחות שלב אחד בתבנית");

  form.stages.forEach(({ stage, criteria }, index) => {
    const stageLabel = stage.name.trim() || `שלב ${index + 1}`;
    report(stageLabel, validateStageForm(stage));

    if (criteria.length === 0) problems.push(`${stageLabel}: אין קריטריונים בשלב`);
    criteria.forEach((criterion, i) =>
      report(
        `${stageLabel} / ${criterion.name.trim() || `קריטריון ${i + 1}`}`,
        validateCriterionForm(criterion)
      )
    );

    const sum = sumCriteriaWeights(criteria);
    if (hasScoredCriteria(criteria) && sum !== 100) {
      problems.push(`${stageLabel}: סכום משקלי הקריטריונים הוא ${sum}% במקום 100%`);
    }
  });

  const total = sumStageWeights(form.stages.map(({ stage }) => stage));
  if (form.stages.length > 0 && total !== 100) {
    problems.push(`סכום משקלי השלבים הוא ${total}% במקום 100%`);
  }

  return problems;
}
