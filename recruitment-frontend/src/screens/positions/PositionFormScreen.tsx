import type { FormEvent } from "react";
import { ErrorAlert, InputField, Notice, SelectField, TextAreaField, toOptions } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi, positionsApi } from "../../services/entities";
import type { JobCategory } from "../../types/jobCategory";
import { POSITION_LEVEL_LABELS, POSITION_STATUS_LABELS } from "../../types/position";
import type { PositionStatus } from "../../types/position";
import {
  MAX_MONTHLY_HOURS,
  NEW_POSITION_FORM,
  positionToForm,
  positionToPayload,
  todayInputValue,
  validatePositionForm,
} from "./positionForm";
import type { PositionFormValues } from "./positionForm";
import { isContentLocked, isFieldLocked, isFinalStatus } from "./positionWorkflow";
import { StagesEditor } from "../stages/StagesEditor";
import "./PositionFormScreen.css";

type PositionFormScreenProps = {
  /** undefined = יצירת משרה חדשה */
  positionId?: string;
  onSaved: (positionId: string) => void;
  onCancel: () => void;
};

export function PositionFormScreen({ positionId, ...rest }: PositionFormScreenProps) {
  const load = useLoad(async () => {
    const [categories, position] = await Promise.all([
      categoriesApi.getAll(),
      positionId ? positionsApi.getById(positionId) : null,
    ]);
    // משרה חדשה תמיד נוצרת כטיוטה, ומתחילה מברירות המחדל של שעות ומשך התקשרות
    const status: PositionStatus = position?.status ?? "DRAFT";
    return { categories, status, initial: position ? positionToForm(position) : NEW_POSITION_FORM };
  }, [positionId]);

  return (
    <LoadGate
      load={load}
      loadingText="טוען את פרטי המשרה..."
      errorTitle="לא הצלחנו לטעון את המשרה"
      action={{ label: "חזרה לרשימה", onClick: rest.onCancel }}
    >
      {({ categories, status, initial }) => (
        <PositionForm
          positionId={positionId}
          categories={categories}
          status={status}
          initial={initial}
          {...rest}
        />
      )}
    </LoadGate>
  );
}

// נפרד מהטעינה, כדי שהטופס יתחיל מהנתונים שנטענו בלי סנכרון מתוך effect
function PositionForm({
  positionId,
  categories,
  status,
  initial,
  onSaved,
  onCancel,
}: PositionFormScreenProps & {
  categories: JobCategory[];
  status: PositionStatus;
  initial: PositionFormValues;
}) {
  const form = useForm(initial);
  const action = useAction();
  const isEdit = Boolean(positionId);
  // השרת אוכף את אותה נעילה. כאן היא רק מונעת מלכתחילה שינוי שיידחה
  const locked = (field: keyof PositionFormValues) => isFieldLocked(status, field);
  const isReadOnly = isFinalStatus(status);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate((values) => validatePositionForm(values, isEdit ? initial : undefined))) return;

    const payload = positionToPayload(form.values);
    action.run(async () => {
      const saved = await (positionId ? positionsApi.update(positionId, payload) : positionsApi.create(payload));
      onSaved(saved._id);
    });
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>{isEdit ? "עריכת משרה" : "משרה חדשה"}</Heading>
          <Text>
            {isEdit
              ? "פרטי המשרה נשמרים בכפתור למטה. השלבים והקריטריונים שמתחתם נשמרים כל אחד בנפרד."
              : "סוג המשרה קובע אילו שלבים וקריטריונים יועתקו למשרה."}
          </Text>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <ErrorAlert message={action.error} />
          {isContentLocked(status) && (
            <Notice>
              {isReadOnly
                ? `המשרה בסטטוס "${POSITION_STATUS_LABELS[status]}", ולכן אי אפשר לערוך אותה.`
                : `המשרה בסטטוס "${POSITION_STATUS_LABELS[status]}": הספקים מגישים לפי הנתונים, ולכן אפשר לעדכן רק את התיאור ואת מועד ההגשה. לתיקון מהותי יש לבטל את התיחור ולפתוח משרה חדשה.`}
            </Notice>
          )}

          <InputField
            form={form}
            name="title"
            label="כותרת המשרה *"
            placeholder="לדוגמה: מהנדס/ת DevOps בכיר/ה"
            disabled={locked("title")}
          />
          <SelectField
            form={form}
            name="categoryId"
            label={isEdit ? "סוג משרה" : "סוג משרה *"}
            hint={isEdit ? "שינוי סוג המשרה לא משנה את השלבים הקיימים" : "קובע את תבנית השלבים והקריטריונים"}
            placeholder={isEdit ? "ללא סוג משרה" : "בחרו סוג משרה"}
            options={categories.map((category) => ({ value: category._id, label: category.name }))}
            disabled={locked("categoryId")}
          />

          <div className="position-form__grid">
            <InputField
              form={form}
              name="clusterCode"
              label="קוד אשכול"
              dir="ltr"
              placeholder="TECH-01"
              disabled={locked("clusterCode")}
            />
            <InputField
              form={form}
              name="roleCode"
              label="קוד תפקיד"
              dir="ltr"
              placeholder="DEVOPS-SR"
              disabled={locked("roleCode")}
            />
            <SelectField
              form={form}
              name="level"
              label="רמה"
              placeholder="ללא רמה"
              options={toOptions(POSITION_LEVEL_LABELS)}
              disabled={locked("level")}
            />
            <InputField
              form={form}
              name="monthlyHours"
              label="היקף שעות חודשי"
              hint={`עד ${MAX_MONTHLY_HOURS} שעות חודשיות`}
              type="number"
              min="1"
              max={MAX_MONTHLY_HOURS}
              disabled={locked("monthlyHours")}
            />
            <InputField
              form={form}
              name="maxHourlyRate"
              label="תעריף שעתי מרבי (₪)"
              type="number"
              min="1"
              disabled={locked("maxHourlyRate")}
            />
            <InputField
              form={form}
              name="durationMonths"
              label="משך ההתקשרות (חודשים)"
              type="number"
              min="1"
              step="1"
              disabled={locked("durationMonths")}
            />
            <InputField
              form={form}
              name="submissionDeadline"
              label="מועד אחרון להגשה"
              type="date"
              min={todayInputValue()}
              disabled={locked("submissionDeadline")}
            />
          </div>

          <TextAreaField
            form={form}
            name="description"
            label="תיאור התפקיד"
            placeholder="תיאור התפקיד, תחומי האחריות והממשקים..."
            disabled={locked("description")}
          />

          <div className="page__actions">
            {!isReadOnly && (
              <Button type="submit" disabled={action.isRunning}>
                {action.isRunning ? "שומר..." : isEdit ? "שמירת שינויים" : "יצירת משרה"}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onCancel}>
              {isReadOnly ? "חזרה" : "ביטול"}
            </Button>
          </div>
        </form>
      </Card>

      {positionId && (
        <section className="position-form__stages">
          <Heading level={2}>שלבים וקריטריונים</Heading>
          <StagesEditor positionId={positionId} readOnly={isContentLocked(status)} />
        </section>
      )}
    </div>
  );
}
