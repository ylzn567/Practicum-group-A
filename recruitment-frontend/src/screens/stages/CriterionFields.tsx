import { InputField, SelectField, TextAreaField, toOptions } from "../../components/FormFields";
import type { FormApi } from "../../hooks/useForm";
import { SCORING_METHOD_LABELS } from "../../types/stage";
import type { CriterionFormValues } from "./stageForms";

const TYPE_OPTIONS = [
  { value: "SCORED", label: "מנוקד" },
  { value: "BOOLEAN", label: "תנאי סף (עובר / לא עובר)" },
];
// ציון ישיר ראשון: זו ברירת המחדל, ולכן הסדר הנפוץ לפני יחס מול יעד
const METHOD_OPTIONS = toOptions({
  DIRECT: SCORING_METHOD_LABELS.DIRECT,
  RATIO: SCORING_METHOD_LABELS.RATIO,
});

/**
 * שדות קריטריון: משותפים לעורך הקריטריון של שלב ולעורך התבנית של קטגוריה.
 * תנאי סף הוא שער עובר/לא עובר, ולכן שדות הניקוד מוצגים רק לקריטריון מנוקד,
 * ובין ערך יעד (RATIO) לציון מרבי (DIRECT) מוצג תמיד רק אחד.
 */
export function CriterionFields({
  form,
  autoFocus,
}: {
  form: FormApi<CriterionFormValues>;
  autoFocus?: boolean;
}) {
  const isScored = form.values.type === "SCORED";
  const isRatio = form.values.scoringMethod === "RATIO";

  return (
    <>
      <InputField
        form={form}
        name="name"
        label="שם הקריטריון *"
        placeholder="לדוגמה: ותק בתפקיד"
        autoFocus={autoFocus}
      />

      <div className="criterion-editor__grid">
        <SelectField form={form} name="type" label="סוג" options={TYPE_OPTIONS} />

        {isScored && (
          <SelectField form={form} name="scoringMethod" label="שיטת ניקוד" options={METHOD_OPTIONS} />
        )}

        {isScored && isRatio && (
          <InputField
            form={form}
            name="targetValue"
            label="ערך יעד *"
            hint="הציון = הערך בפועל ÷ ערך היעד"
            type="number"
            min="1"
          />
        )}

        {isScored && !isRatio && (
          <InputField form={form} name="maxScore" label="ציון מרבי *" type="number" min="1" />
        )}

        {isScored && (
          <InputField
            form={form}
            name="weightPercent"
            label="משקל בשלב (%) *"
            type="number"
            min="1"
            max="100"
          />
        )}
      </div>

      <TextAreaField
        form={form}
        name="descriptionGuide"
        label="הנחיה למראיין"
        hint="הטקסט שהמראיין יראה במסך הניקוד"
      />
    </>
  );
}
