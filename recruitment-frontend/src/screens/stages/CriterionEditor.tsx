import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Field, Input, Select, Textarea } from "../../design-system/components";
import { createCriterion, updateCriterion } from "../../services/stages.service";
import type { Criterion } from "../../types/stage";
import {
  EMPTY_CRITERION_FORM,
  criterionToForm,
  criterionToPayload,
  validateCriterionForm,
} from "./stagesBuilder";
import type { CriterionFormErrors, CriterionFormValues } from "./stagesBuilder";

type CriterionEditorProps = {
  stageId: string;
  /** undefined = קריטריון חדש */
  criterion?: Criterion;
  onSaved: () => void;
  onCancel: () => void;
};

export function CriterionEditor({
  stageId,
  criterion,
  onSaved,
  onCancel,
}: CriterionEditorProps) {
  const [values, setValues] = useState<CriterionFormValues>(
    criterion ? criterionToForm(criterion) : EMPTY_CRITERION_FORM
  );
  const [errors, setErrors] = useState<CriterionFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isScored = values.type === "SCORED";
  const isRatio = values.scoringMethod === "RATIO";

  function updateField(field: keyof CriterionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const validationErrors = validateCriterionForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = criterionToPayload(values, stageId);
      if (criterion) {
        await updateCriterion(criterion._id, payload);
      } else {
        await createCriterion(payload);
      }
      onSaved();
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="criterion-editor" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <p className="form-alert" role="alert">
          {serverError}
        </p>
      )}

      <div className={errors.name ? "form-invalid" : undefined}>
        <Field label="שם הקריטריון *" hint={errors.name}>
          <Input
            value={values.name}
            placeholder="לדוגמה: ותק בתפקיד"
            autoFocus
            onChange={(e) => updateField("name", e.target.value)}
          />
        </Field>
      </div>

      <div className="criterion-editor__grid">
        <Field label="סוג">
          <Select
            value={values.type}
            onChange={(e) => updateField("type", e.target.value)}
          >
            <option value="SCORED">מנוקד</option>
            <option value="BOOLEAN">תנאי סף (עובר / לא עובר)</option>
          </Select>
        </Field>

        {isScored && (
          <Field label="שיטת ניקוד">
            <Select
              value={values.scoringMethod}
              onChange={(e) => updateField("scoringMethod", e.target.value)}
            >
              <option value="DIRECT">ציון ישיר</option>
              <option value="RATIO">יחס מול ערך יעד</option>
            </Select>
          </Field>
        )}

        {isScored && isRatio && (
          <div className={errors.targetValue ? "form-invalid" : undefined}>
            <Field
              label="ערך יעד *"
              hint={errors.targetValue ?? "הציון = הערך בפועל ÷ ערך היעד"}
            >
              <Input
                type="number"
                min="1"
                value={values.targetValue}
                onChange={(e) => updateField("targetValue", e.target.value)}
              />
            </Field>
          </div>
        )}

        {isScored && !isRatio && (
          <div className={errors.maxScore ? "form-invalid" : undefined}>
            <Field label="ציון מרבי *" hint={errors.maxScore}>
              <Input
                type="number"
                min="1"
                value={values.maxScore}
                onChange={(e) => updateField("maxScore", e.target.value)}
              />
            </Field>
          </div>
        )}

        {isScored && (
          <div className={errors.weightPercent ? "form-invalid" : undefined}>
            <Field label="משקל בשלב (%) *" hint={errors.weightPercent}>
              <Input
                type="number"
                min="1"
                max="100"
                value={values.weightPercent}
                onChange={(e) => updateField("weightPercent", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <Field
        label="הנחיה למראיין"
        hint="הטקסט שהמראיין יראה במסך הניקוד"
      >
        <Textarea
          value={values.descriptionGuide}
          onChange={(e) => updateField("descriptionGuide", e.target.value)}
        />
      </Field>

      <div className="stage-card__actions">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "שומר..." : "שמירה"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
