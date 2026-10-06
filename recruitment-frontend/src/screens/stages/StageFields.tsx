import { InputField } from "../../components/FormFields";
import type { FormApi } from "../../hooks/useForm";
import type { StageFormValues } from "./stageForms";

/** שדות שלב: משותפים לכרטיס השלב של משרה ולעורך התבנית של קטגוריה */
export function StageFields({ form }: { form: FormApi<StageFormValues> }) {
  return (
    <div className="stage-card__grid">
      <InputField form={form} name="name" label="שם השלב *" />
      <InputField
        form={form}
        name="weightPercent"
        label="משקל במשרה (%) *"
        hint="0 לשלב של תנאי סף"
        type="number"
        min="0"
        max="100"
      />
      <InputField
        form={form}
        name="quota"
        label="מכסת מעבר"
        hint="כמה מועמדים ממשיכים לשלב הבא"
        type="number"
        min="0"
        step="1"
      />
    </div>
  );
}
