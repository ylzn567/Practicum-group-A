import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
} from "../../design-system/components";
import {
  createJobCategory,
  getJobCategoryById,
  updateJobCategory,
} from "../../services/jobCategories.service";
import { WeightMeter } from "../stages/WeightMeter";
import {
  EMPTY_CATEGORY,
  EMPTY_CRITERION_TEMPLATE,
  EMPTY_STAGE_TEMPLATE,
  categoryToForm,
  categoryToPayload,
  hasScoredTemplateCriteria,
  sumCriteriaTemplateWeights,
  sumStageTemplateWeights,
  validateCategory,
} from "./categoryTemplate";
import type {
  CategoryForm,
  CriterionTemplateForm,
  StageTemplateForm,
} from "./categoryTemplate";
import "./CategoryEditorScreen.css";

type CategoryEditorScreenProps = {
  /** undefined = קטגוריה חדשה */
  categoryId?: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function CategoryEditorScreen({
  categoryId,
  onSaved,
  onCancel,
}: CategoryEditorScreenProps) {
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [problems, setProblems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(categoryId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    let isCancelled = false;

    (async () => {
      try {
        const category = await getJobCategoryById(categoryId);
        if (!isCancelled) setForm(categoryToForm(category));
      } catch (err) {
        if (!isCancelled) setLoadError((err as Error).message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [categoryId]);

  // ===== עריכת המערך המקונן =====

  function updateStage(index: number, patch: Partial<StageTemplateForm>) {
    setForm((prev) => ({
      ...prev,
      stageTemplates: prev.stageTemplates.map((stage, i) =>
        i === index ? { ...stage, ...patch } : stage
      ),
    }));
  }

  function updateCriterion(
    stageIndex: number,
    criterionIndex: number,
    patch: Partial<CriterionTemplateForm>
  ) {
    setForm((prev) => ({
      ...prev,
      stageTemplates: prev.stageTemplates.map((stage, i) =>
        i !== stageIndex
          ? stage
          : {
              ...stage,
              criteria: stage.criteria.map((criterion, j) =>
                j === criterionIndex ? { ...criterion, ...patch } : criterion
              ),
            }
      ),
    }));
  }

  function addStage() {
    setForm((prev) => ({
      ...prev,
      stageTemplates: [...prev.stageTemplates, { ...EMPTY_STAGE_TEMPLATE }],
    }));
  }

  function removeStage(index: number) {
    const stage = form.stageTemplates[index];
    const label = stage.name.trim() || `שלב ${index + 1}`;
    if (!window.confirm(`למחוק את "${label}" ואת הקריטריונים שבו?`)) return;

    setForm((prev) => ({
      ...prev,
      stageTemplates: prev.stageTemplates.filter((_, i) => i !== index),
    }));
  }

  function moveStage(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= form.stageTemplates.length) return;

    setForm((prev) => {
      const stages = [...prev.stageTemplates];
      [stages[index], stages[target]] = [stages[target], stages[index]];
      return { ...prev, stageTemplates: stages };
    });
  }

  function addCriterion(stageIndex: number) {
    setForm((prev) => ({
      ...prev,
      stageTemplates: prev.stageTemplates.map((stage, i) =>
        i === stageIndex
          ? { ...stage, criteria: [...stage.criteria, { ...EMPTY_CRITERION_TEMPLATE }] }
          : stage
      ),
    }));
  }

  function removeCriterion(stageIndex: number, criterionIndex: number) {
    setForm((prev) => ({
      ...prev,
      stageTemplates: prev.stageTemplates.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              criteria: stage.criteria.filter((_, j) => j !== criterionIndex),
            }
          : stage
      ),
    }));
  }

  async function handleSave() {
    setServerError(null);

    const found = validateCategory(form);
    setProblems(found);
    if (found.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = categoryToPayload(form);
      if (categoryId) {
        await updateJobCategory(categoryId, payload);
      } else {
        await createJobCategory(payload);
      }
      onSaved();
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען את הקטגוריה...</Text>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <Card>
          <Heading level={3}>לא הצלחנו לטעון את הקטגוריה</Heading>
          <Text>{loadError}</Text>
          <div className="category__actions">
            <Button variant="secondary" onClick={onCancel}>
              חזרה
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalWeight = sumStageTemplateWeights(form.stageTemplates);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>
            {categoryId ? "עריכת קטגוריה" : "קטגוריה חדשה"}
          </Heading>
          <Text>
            התבנית הזו מועתקת לכל משרה חדשה שנפתחת בקטגוריה. שינוי כאן לא משפיע
            על משרות שכבר קיימות.
          </Text>
        </div>
        <div className="category__actions">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "שומר..." : "שמירת הקטגוריה"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </header>

      {serverError && (
        <p className="form-alert" role="alert">
          {serverError}
        </p>
      )}

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
          <Field label="שם הקטגוריה *">
            <Input
              value={form.name}
              placeholder="לדוגמה: DevOps"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </Field>
          <Field label="תיאור">
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </Field>
        </Card>
      </div>

      {form.stageTemplates.length > 0 && (
        <div className="category__block">
          <Card>
            <WeightMeter total={totalWeight} label="סכום משקלי השלבים" />
          </Card>
        </div>
      )}

      {form.stageTemplates.map((stage, stageIndex) => {
        const criteriaWeight = sumCriteriaTemplateWeights(stage.criteria);
        const showMeter = hasScoredTemplateCriteria(stage.criteria);

        return (
          <div className="category__block" key={stageIndex}>
            <Card>
              <div className="category__stage-header">
                <Heading level={3}>שלב {stageIndex + 1}</Heading>
                <div className="category__actions">
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
                    disabled={stageIndex === form.stageTemplates.length - 1}
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

              <div className="category__stage-grid">
                <Field label="שם השלב *">
                  <Input
                    value={stage.name}
                    placeholder="לדוגמה: ראיון טלפוני"
                    onChange={(e) => updateStage(stageIndex, { name: e.target.value })}
                  />
                </Field>
                <Field label="משקל במשרה (%) *" hint="0 לשלב של תנאי סף">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={stage.weightPercent}
                    onChange={(e) =>
                      updateStage(stageIndex, { weightPercent: e.target.value })
                    }
                  />
                </Field>
                <Field label="מכסת מעבר">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={stage.quota}
                    onChange={(e) => updateStage(stageIndex, { quota: e.target.value })}
                  />
                </Field>
              </div>

              <div className="category__criteria">
                <div className="category__criteria-header">
                  <Heading level={3}>קריטריונים</Heading>
                  {showMeter && (
                    <WeightMeter
                      total={criteriaWeight}
                      label="סכום משקלי הקריטריונים"
                    />
                  )}
                </div>

                {stage.criteria.length === 0 && (
                  <Text>אין עדיין קריטריונים בשלב הזה.</Text>
                )}

                {stage.criteria.map((criterion, criterionIndex) => {
                  const isScored = criterion.type === "SCORED";
                  const isRatio = criterion.scoringMethod === "RATIO";

                  return (
                    <div className="category__criterion" key={criterionIndex}>
                      <div className="category__criterion-grid">
                        <Field label="שם הקריטריון *">
                          <Input
                            value={criterion.name}
                            onChange={(e) =>
                              updateCriterion(stageIndex, criterionIndex, {
                                name: e.target.value,
                              })
                            }
                          />
                        </Field>

                        <Field label="סוג">
                          <Select
                            value={criterion.type}
                            onChange={(e) =>
                              updateCriterion(stageIndex, criterionIndex, {
                                type: e.target.value,
                              })
                            }
                          >
                            <option value="SCORED">מנוקד</option>
                            <option value="BOOLEAN">תנאי סף</option>
                          </Select>
                        </Field>

                        {isScored && (
                          <Field label="שיטת ניקוד">
                            <Select
                              value={criterion.scoringMethod}
                              onChange={(e) =>
                                updateCriterion(stageIndex, criterionIndex, {
                                  scoringMethod: e.target.value,
                                })
                              }
                            >
                              <option value="DIRECT">ציון ישיר</option>
                              <option value="RATIO">יחס מול ערך יעד</option>
                            </Select>
                          </Field>
                        )}

                        {isScored && isRatio && (
                          <Field label="ערך יעד *">
                            <Input
                              type="number"
                              min="1"
                              value={criterion.targetValue}
                              onChange={(e) =>
                                updateCriterion(stageIndex, criterionIndex, {
                                  targetValue: e.target.value,
                                })
                              }
                            />
                          </Field>
                        )}

                        {isScored && !isRatio && (
                          <Field label="ציון מרבי *">
                            <Input
                              type="number"
                              min="1"
                              value={criterion.maxScore}
                              onChange={(e) =>
                                updateCriterion(stageIndex, criterionIndex, {
                                  maxScore: e.target.value,
                                })
                              }
                            />
                          </Field>
                        )}

                        {isScored && (
                          <Field label="משקל בשלב (%) *">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={criterion.weightPercent}
                              onChange={(e) =>
                                updateCriterion(stageIndex, criterionIndex, {
                                  weightPercent: e.target.value,
                                })
                              }
                            />
                          </Field>
                        )}
                      </div>

                      <Field label="הנחיה למראיין">
                        <Textarea
                          value={criterion.descriptionGuide}
                          onChange={(e) =>
                            updateCriterion(stageIndex, criterionIndex, {
                              descriptionGuide: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <div className="category__actions">
                        <Button
                          variant="danger"
                          onClick={() => removeCriterion(stageIndex, criterionIndex)}
                        >
                          הסרת הקריטריון
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="category__actions">
                  <Button variant="secondary" onClick={() => addCriterion(stageIndex)}>
                    הוספת קריטריון
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })}

      <div className="category__actions">
        <Button variant="secondary" onClick={addStage}>
          הוספת שלב
        </Button>
      </div>
    </div>
  );
}
