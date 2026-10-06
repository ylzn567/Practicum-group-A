import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Select,
  Table,
  Text,
} from "../../design-system/components";
import { getJobCategories } from "../../services/jobCategories.service";
import {
  createPositionFromMapal,
  parseMapalFile,
} from "../../services/positions.service";
import type { JobCategory } from "../../types/jobCategory";
import type { MapalDraft } from "../../types/mapalImport";
import { POSITION_LEVEL_LABELS } from "../../types/position";
import type { PositionLevel } from "../../types/position";
import { CRITERION_TYPE_LABELS, SCORING_METHOD_LABELS } from "../../types/stage";
import { WeightMeter } from "../stages/WeightMeter";
import "./MapalImportScreen.css";

const LEVELS = Object.keys(POSITION_LEVEL_LABELS) as PositionLevel[];

type MapalImportScreenProps = {
  onCreated: (positionId: string) => void;
  onCancel: () => void;
};

export function MapalImportScreen({ onCreated, onCancel }: MapalImportScreenProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapalDraft | null>(null);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<PositionLevel | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    // הקטגוריה אופציונלית, ולכן כשל בטעינה לא חוסם את הייבוא
    getJobCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // מאפשר לבחור שוב את אותו קובץ אחרי תיקון
    if (!file) return;

    setError(null);
    setDraft(null);
    setFileName(file.name);
    setIsParsing(true);
    try {
      const parsed = await parseMapalFile(file);
      setDraft(parsed);
      setTitle(parsed.title);
      setLevel(parsed.level ?? "");
      setCategoryId("");
      setTitleError(null);
    } catch (err) {
      setError((err as Error).message);
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  }

  function reset() {
    setDraft(null);
    setFileName(null);
    setError(null);
  }

  async function handleCreate() {
    if (!draft) return;
    if (title.trim().length < 2) {
      setTitleError("יש להזין כותרת למשרה");
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      const created = await createPositionFromMapal({
        title: title.trim(),
        categoryId: categoryId || undefined,
        level: level || undefined,
        stages: draft.stages,
      });
      onCreated(created._id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  const totalWeight = draft
    ? draft.stages.reduce((sum, stage) => sum + stage.weightPercent, 0)
    : 0;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>ייבוא מפ״ל מקובץ</Heading>
          <Text>
            מעלים קובץ Excel של מפ״ל, ובונים ממנו משרה עם שלבים וקריטריונים. קודם
            מוצגת תצוגה מקדימה, ושום דבר לא נוצר עד שמאשרים.
          </Text>
        </div>
        <Button variant="secondary" onClick={onCancel}>
          חזרה למשרות
        </Button>
      </header>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {!draft && (
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
              disabled={isParsing}
            />
          </Field>
          {isParsing && <Text>מנתח את {fileName}...</Text>}
        </Card>
      )}

      {draft && (
        <>
          <div className="import__block">
            <Card>
              <div className="import__file">
                <Heading level={3}>{fileName}</Heading>
                <Badge tone={draft.format === "recruitment" ? "published" : "pending"}>
                  {draft.format === "recruitment"
                    ? "קובץ שיוצא מהמערכת"
                    : "קובץ מקורי של המשרד"}
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
                <div className={titleError ? "form-invalid" : undefined}>
                  <Field label="כותרת המשרה *" hint={titleError ?? undefined}>
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setTitleError(null);
                      }}
                    />
                  </Field>
                </div>

                <Field label="רמה">
                  <Select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as PositionLevel | "")}
                  >
                    <option value="">ללא רמה</option>
                    {LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {POSITION_LEVEL_LABELS[item]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="קטגוריה"
                  hint="לא חובה. הקטגוריה לא מעתיקה תבנית, כי המבנה בא מהקובץ."
                >
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">ללא קטגוריה</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Card>
          </div>

          <div className="import__block">
            <Card>
              <WeightMeter total={totalWeight} label="סכום משקלי השלבים" />
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

                <Table>
                  <thead>
                    <tr>
                      <th>קריטריון</th>
                      <th>סוג</th>
                      <th>שיטה</th>
                      <th>יעד / מקסימום</th>
                      <th>משקל</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.criteria.map((criterion, index) => (
                      <tr key={`${index}-${criterion.name}`}>
                        <td>{criterion.name}</td>
                        <td>
                          <Badge
                            tone={criterion.type === "BOOLEAN" ? "pending" : "published"}
                          >
                            {CRITERION_TYPE_LABELS[criterion.type]}
                          </Badge>
                        </td>
                        <td>
                          {criterion.scoringMethod
                            ? SCORING_METHOD_LABELS[criterion.scoringMethod]
                            : "—"}
                        </td>
                        <td className="num">
                          {criterion.targetValue ?? criterion.maxScore ?? "—"}
                        </td>
                        <td className="num">
                          {criterion.weightPercent != null
                            ? `${criterion.weightPercent}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </div>
          ))}

          <div className="import__actions">
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "יוצר..." : "יצירת המשרה"}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={isCreating}>
              בחירת קובץ אחר
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={isCreating}>
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
