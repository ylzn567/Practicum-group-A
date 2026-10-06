import type { FormEvent } from "react";
import { ErrorAlert, InputField, SelectField, TextAreaField, toOptions } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { categoriesApi, positionsApi } from "../../services/entities";
import type { JobCategory } from "../../types/jobCategory";
import { POSITION_LEVEL_LABELS, POSITION_STATUS_LABELS } from "../../types/position";
import {
  EMPTY_POSITION_FORM,
  MAX_MONTHLY_HOURS,
  positionToForm,
  positionToPayload,
  todayInputValue,
  validatePositionForm,
} from "./positionForm";
import type { PositionFormValues } from "./positionForm";
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
    return { categories, initial: position ? positionToForm(position) : EMPTY_POSITION_FORM };
  }, [positionId]);

  return (
    <LoadGate
      load={load}
      loadingText="טוען את פרטי המשרה..."
      errorTitle="לא הצלחנו לטעון את המשרה"
      action={{ label: "חזרה לרשימה", onClick: rest.onCancel }}
    >
      {({ categories, initial }) => (
        <PositionForm positionId={positionId} categories={categories} initial={initial} {...rest} />
      )}
    </LoadGate>
  );
}

// נפרד מהטעינה, כדי שהטופס יתחיל מהנתונים שנטענו בלי סנכרון מתוך effect
function PositionForm({
  positionId,
  categories,
  initial,
  onSaved,
  onCancel,
}: PositionFormScreenProps & { categories: JobCategory[]; initial: PositionFormValues }) {
  const form = useForm(initial);
  const action = useAction();
  const isEdit = Boolean(positionId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate(validatePositionForm)) return;

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
              ? "שינויים נשמרים על המשרה הקיימת, בלי לגעת בשלבים ובקריטריונים."
              : "הקטגוריה קובעת אילו שלבים וקריטריונים יועתקו למשרה."}
          </Text>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <ErrorAlert message={action.error} />

          <InputField
            form={form}
            name="title"
            label="כותרת המשרה *"
            placeholder="לדוגמה: מהנדס/ת DevOps בכיר/ה"
          />
          <SelectField
            form={form}
            name="categoryId"
            label="קטגוריית משרה *"
            hint="קובעת את תבנית השלבים והקריטריונים"
            placeholder="בחרו קטגוריה"
            options={categories.map((category) => ({ value: category._id, label: category.name }))}
          />

          <div className="position-form__grid">
            <InputField form={form} name="clusterCode" label="קוד אשכול" dir="ltr" placeholder="TECH-01" />
            <InputField form={form} name="roleCode" label="קוד תפקיד" dir="ltr" placeholder="DEVOPS-SR" />
            <SelectField
              form={form}
              name="level"
              label="רמה"
              placeholder="ללא רמה"
              options={toOptions(POSITION_LEVEL_LABELS)}
            />
            <SelectField form={form} name="status" label="סטטוס" options={toOptions(POSITION_STATUS_LABELS)} />
            <InputField
              form={form}
              name="monthlyHours"
              label="היקף שעות חודשי"
              hint={`עד ${MAX_MONTHLY_HOURS} שעות חודשיות`}
              type="number"
              min="1"
              max={MAX_MONTHLY_HOURS}
            />
            <InputField form={form} name="maxHourlyRate" label="תעריף שעתי מרבי (₪)" type="number" min="1" />
            <InputField
              form={form}
              name="durationMonths"
              label="משך ההתקשרות (חודשים)"
              type="number"
              min="1"
              step="1"
            />
            <InputField
              form={form}
              name="submissionDeadline"
              label="מועד אחרון להגשה"
              type="date"
              min={todayInputValue()}
            />
          </div>

          <TextAreaField
            form={form}
            name="description"
            label="תיאור התפקיד"
            placeholder="תיאור התפקיד, תחומי האחריות והממשקים..."
          />

          <div className="page__actions">
            <Button type="submit" disabled={action.isRunning}>
              {action.isRunning ? "שומר..." : isEdit ? "שמירת שינויים" : "יצירת משרה"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              ביטול
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
