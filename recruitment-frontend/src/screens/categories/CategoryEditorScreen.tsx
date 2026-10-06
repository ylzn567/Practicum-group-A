import { useState } from "react";
import { ErrorAlert, InputField, TextAreaField } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { formApi } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi } from "../../services/entities";
import { removeAt, replaceAt, swap } from "../../utils/list";
import { CriterionFields } from "../stages/CriterionFields";
import { StageFields } from "../stages/StageFields";
import {
  EMPTY_CRITERION_FORM,
  hasScoredCriteria,
  sumCriteriaWeights,
  sumStageWeights,
} from "../stages/stageForms";
import { WeightMeter } from "../stages/WeightMeter";
import {
  EMPTY_CATEGORY,
  EMPTY_STAGE_TEMPLATE,
  categoryToForm,
  categoryToPayload,
  validateCategory,
} from "./categoryTemplate";
import type { CategoryForm, StageTemplateForm } from "./categoryTemplate";
import "./CategoryEditorScreen.css";

type CategoryEditorScreenProps = {
  /** undefined = קטגוריה חדשה */
  categoryId?: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function CategoryEditorScreen({ categoryId, onSaved, onCancel }: CategoryEditorScreenProps) {
  const load = useLoad(
    async () => (categoryId ? categoryToForm(await categoriesApi.getById(categoryId)) : EMPTY_CATEGORY),
    [categoryId]
  );

  return (
    <LoadGate
      load={load}
      loadingText="טוען את הקטגוריה..."
      errorTitle="לא הצלחנו לטעון את הקטגוריה"
      action={{ label: "חזרה", onClick: onCancel }}
    >
      {(initial) => (
        <CategoryEditor categoryId={categoryId} initial={initial} onSaved={onSaved} onCancel={onCancel} />
      )}
    </LoadGate>
  );
}

// נפרד מהטעינה, כדי שהטופס יתחיל מהנתונים שנטענו בלי סנכרון מתוך effect
function CategoryEditor({
  categoryId,
  initial,
  onSaved,
  onCancel,
}: CategoryEditorScreenProps & { initial: CategoryForm }) {
  const [form, setForm] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const action = useAction();

  const updateStage = (index: number, change: (stage: StageTemplateForm) => StageTemplateForm) =>
    setForm((previous) => ({
      ...previous,
      stages: replaceAt(previous.stages, index, change(previous.stages[index])),
    }));

  const moveStage = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target >= 0 && target < form.stages.length) {
      setForm((previous) => ({ ...previous, stages: swap(previous.stages, index, target) }));
    }
  };

  const removeStage = (index: number) => {
    const label = form.stages[index].stage.name.trim() || `שלב ${index + 1}`;
    if (window.confirm(`למחוק את "${label}" ואת הקריטריונים שבו?`)) {
      setForm((previous) => ({ ...previous, stages: removeAt(previous.stages, index) }));
    }
  };

  const handleSave = () => {
    const found = validateCategory(form);
    setProblems(found);
    if (found.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    action.run(async () => {
      const payload = categoryToPayload(form);
      await (categoryId ? categoriesApi.update(categoryId, payload) : categoriesApi.create(payload));
      onSaved();
    });
  };

  const details = formApi({ name: form.name, description: form.description }, (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }))
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>{categoryId ? "עריכת קטגוריה" : "קטגוריה חדשה"}</Heading>
          <Text>
            התבנית הזו מועתקת לכל משרה חדשה שנפתחת בקטגוריה. שינוי כאן לא משפיע על משרות שכבר
            קיימות.
          </Text>
        </div>
        <div className="page__actions">
          <Button onClick={handleSave} disabled={action.isRunning}>
            {action.isRunning ? "שומר..." : "שמירת הקטגוריה"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </header>

      <ErrorAlert message={action.error} />

      {problems.length > 0 && (
        <div className="category__problems" role="alert">
          <strong>{problems.length} דברים למלא לפני שמירה:</strong>
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="category__block">
        <Card>
          <InputField form={details} name="name" label="שם הקטגוריה *" placeholder="לדוגמה: DevOps" />
          <TextAreaField form={details} name="description" label="תיאור" />
        </Card>
      </div>

      {form.stages.length > 0 && (
        <div className="category__block">
          <Card>
            <WeightMeter
              total={sumStageWeights(form.stages.map(({ stage }) => stage))}
              label="סכום משקלי השלבים"
            />
          </Card>
        </div>
      )}

      {form.stages.map(({ stage, criteria }, stageIndex) => (
        <div className="category__block" key={stageIndex}>
          <Card>
            <div className="category__stage-header">
              <Heading level={3}>שלב {stageIndex + 1}</Heading>
              <div className="page__actions">
                <Button
                  variant="secondary"
                  disabled={stageIndex === 0}
                  aria-label="הזזה למעלה"
                  onClick={() => moveStage(stageIndex, "up")}
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  disabled={stageIndex === form.stages.length - 1}
                  aria-label="הזזה למטה"
                  onClick={() => moveStage(stageIndex, "down")}
                >
                  ↓
                </Button>
                <Button variant="danger" onClick={() => removeStage(stageIndex)}>
                  מחיקת השלב
                </Button>
              </div>
            </div>

            <StageFields
              form={formApi(stage, (field, value) =>
                updateStage(stageIndex, (current) => ({
                  ...current,
                  stage: { ...current.stage, [field]: value },
                }))
              )}
            />

            <div className="category__criteria">
              <div className="category__criteria-header">
                <Heading level={3}>קריטריונים</Heading>
                {hasScoredCriteria(criteria) && (
                  <WeightMeter total={sumCriteriaWeights(criteria)} label="סכום משקלי הקריטריונים" />
                )}
              </div>

              {criteria.length === 0 && <Text>אין עדיין קריטריונים בשלב הזה.</Text>}

              {criteria.map((criterion, criterionIndex) => (
                <div className="category__criterion" key={criterionIndex}>
                  <CriterionFields
                    form={formApi(criterion, (field, value) =>
                      updateStage(stageIndex, (current) => ({
                        ...current,
                        criteria: replaceAt(current.criteria, criterionIndex, {
                          ...criterion,
                          [field]: value,
                        }),
                      }))
                    )}
                  />
                  <div className="page__actions">
                    <Button
                      variant="danger"
                      onClick={() =>
                        updateStage(stageIndex, (current) => ({
                          ...current,
                          criteria: removeAt(current.criteria, criterionIndex),
                        }))
                      }
                    >
                      הסרת הקריטריון
                    </Button>
                  </div>
                </div>
              ))}

              <div className="page__actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateStage(stageIndex, (current) => ({
                      ...current,
                      criteria: [...current.criteria, EMPTY_CRITERION_FORM],
                    }))
                  }
                >
                  הוספת קריטריון
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ))}

      <div className="page__actions">
        <Button
          variant="secondary"
          onClick={() => setForm((previous) => ({ ...previous, stages: [...previous.stages, EMPTY_STAGE_TEMPLATE] }))}
        >
          הוספת שלב
        </Button>
      </div>
    </div>
  );
}
