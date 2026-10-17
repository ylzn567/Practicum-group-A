import type { FormEvent } from "react";
import { ErrorAlert } from "../../components/FormFields";
import { Button } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { criteriaApi } from "../../services/entities";
import type { Criterion } from "../../types/stage";
import { CriterionFields } from "./CriterionFields";
import {
  EMPTY_CRITERION_FORM,
  criterionToForm,
  criterionToPayload,
  validateCriterionForm,
} from "./stageForms";

type CriterionEditorProps = {
  stageId: string;
  /** undefined = קריטריון חדש */
  criterion?: Criterion;
  onSaved: () => void;
  onCancel: () => void;
};

export function CriterionEditor({ stageId, criterion, onSaved, onCancel }: CriterionEditorProps) {
  const form = useForm(criterion ? criterionToForm(criterion) : EMPTY_CRITERION_FORM);
  const action = useAction();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.validate(validateCriterionForm)) return;

    const payload = { ...criterionToPayload(form.values), stageId };
    const saved = await action.run(() =>
      criterion ? criteriaApi.update(criterion._id, payload) : criteriaApi.create(payload)
    );
    if (saved) onSaved();
  }

  return (
    <form className="criterion-editor" onSubmit={handleSubmit} noValidate>
      <ErrorAlert message={action.error} />
      <CriterionFields form={form} autoFocus />

      <div className="page__actions">
        <Button type="submit" disabled={action.isRunning}>
          {action.isRunning ? "שומר..." : "שמירה"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
