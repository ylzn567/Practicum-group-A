import { useState } from "react";
import type { ChangeEvent } from "react";
import { ErrorAlert, InputField, SelectField, toOptions } from "../../components/FormFields";
import { Badge, Button, Card, Field, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi, createPositionFromMapal, parseMapalFile } from "../../services/entities";
import type { MapalDraft } from "../../types/mapalImport";
import { POSITION_LEVEL_LABELS } from "../../types/position";
import type { PositionLevel } from "../../types/position";
import { text } from "../../utils/validation";
import { CriteriaTable } from "../stages/CriteriaTable";
import { sumStageWeights } from "../stages/stageForms";
import { WeightMeter } from "../stages/WeightMeter";
import "./MapalImportScreen.css";

type MapalImportScreenProps = {
  onCreated: (positionId: string) => void;
  onCancel: () => void;
};

const LEVEL_OPTIONS = toOptions(POSITION_LEVEL_LABELS);

export function MapalImportScreen({ onCreated, onCancel }: MapalImportScreenProps) {
  // הקטגוריה אופציונלית, ולכן כשל בטעינה שלה לא חוסם את הייבוא
  const categories = useLoad(() => categoriesApi.getAll().catch(() => []));
  const parser = useAction();
  const creator = useAction();
  const form = useForm({ title: "", level: "", categoryId: "" });
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapalDraft | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // מאפשר לבחור שוב את אותו קובץ אחרי תיקון
    if (!file) return;

    setDraft(null);
    setPickedName(file.name);
    await parser.run(async () => {
      const parsed = await parseMapalFile(file);
      form.reset({ title: parsed.title, level: parsed.level ?? "", categoryId: "" });
      setDraft(parsed);
    });
  };

  const reset = () => {
    setDraft(null);
    parser.setError(null);
    creator.setError(null);
  };

  const handleCreate = () => {
    if (!draft) return;
    const isValid = form.validate((values) =>
      values.title.trim().length < 2 ? { title: "יש להזין כותרת למשרה" } : {}
    );
    if (!isValid) return;

    creator.run(async () => {
      const created = await createPositionFromMapal({
        title: form.values.title.trim(),
        categoryId: text(form.values.categoryId),
        level: text(form.values.level) as PositionLevel | undefined,
        stages: draft.stages,
      });
      onCreated(created._id);
    });
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>ייבוא מפ״ל מקובץ</Heading>
          <Text>
            מעלים קובץ Excel של מפ״ל, ובונים ממנו משרה עם שלבים וקריטריונים. קודם מוצגת תצוגה
            מקדימה, ושום דבר לא נוצר עד שמאשרים.
          </Text>
        </div>
        <Button variant="secondary" onClick={onCancel}>
          חזרה למשרות
        </Button>
      </header>

      <ErrorAlert message={parser.error ?? creator.error} />

      {!draft ? (
        <Card>
          <Heading level={3}>בחירת קובץ</Heading>
          <Field
            label="קובץ מפ״ל (xlsx)"
            hint="אפשר להעלות קובץ מקורי של המשרד, או קובץ שיוצא ממערכת הגיוס. קבצי xls ישנים צריך לשמור מחדש כ-xlsx."
          >
            <input
              className="rf-input"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFile}
              disabled={parser.isRunning}
            />
          </Field>
          {parser.isRunning && <Text>מנתח את {pickedName}...</Text>}
        </Card>
      ) : (
        <>
          <div className="import__block">
            <Card>
              <div className="import__file">
                <Heading level={3}>{pickedName}</Heading>
                <Badge tone={draft.format === "recruitment" ? "published" : "pending"}>
                  {draft.format === "recruitment" ? "קובץ שיוצא מהמערכת" : "קובץ מקורי של המשרד"}
                </Badge>
              </div>

              {draft.warnings.length > 0 && (
                <div className="import__warnings" role="note">
                  <strong>כדאי לשים לב ({draft.warnings.length}):</strong>
                  <ul>
                    {draft.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="import__grid">
                <InputField form={form} name="title" label="כותרת המשרה *" />
                <SelectField form={form} name="level" label="רמה" placeholder="ללא רמה" options={LEVEL_OPTIONS} />
                <SelectField
                  form={form}
                  name="categoryId"
                  label="קטגוריה"
                  hint="לא חובה. הקטגוריה לא מעתיקה תבנית, כי המבנה בא מהקובץ."
                  placeholder="ללא קטגוריה"
                  options={(categories.data ?? []).map((category) => ({
                    value: category._id,
                    label: category.name,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="import__block">
            <Card>
              <WeightMeter total={sumStageWeights(draft.stages)} label="סכום משקלי השלבים" />
            </Card>
          </div>

          {draft.stages.map((stage) => (
            <div className="import__block" key={stage.order}>
              <Card>
                <div className="import__file">
                  <Heading level={3}>
                    {stage.order}. {stage.name}
                  </Heading>
                  <Badge tone={stage.weightPercent > 0 ? "published" : "draft"}>
                    משקל {stage.weightPercent}%
                  </Badge>
                  <Badge tone="draft">{stage.criteria.length} קריטריונים</Badge>
                </div>
                <CriteriaTable criteria={stage.criteria} />
              </Card>
            </div>
          ))}

          <div className="page__actions">
            <Button onClick={handleCreate} disabled={creator.isRunning}>
              {creator.isRunning ? "יוצר..." : "יצירת המשרה"}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={creator.isRunning}>
              בחירת קובץ אחר
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={creator.isRunning}>
              ביטול
            </Button>
          </div>
          <p className="import__footnote">
            המשרה תיווצר כטיוטה. אחרי היצירה אפשר לערוך שלבים וקריטריונים בכרטיס המשרה.
          </p>
        </>
      )}
    </div>
  );
}
