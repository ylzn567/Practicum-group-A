import { useState } from "react";

export type FormErrors<V> = Partial<Record<keyof V, string>>;

/** ההיבט של טופס ש-InputField / SelectField צריכים. אפשר גם לבנות אחד ידנית לטפסים מקוננים */
export interface FormApi<V> {
  values: V;
  errors: FormErrors<V>;
  set: (field: keyof V, value: string) => void;
}

/** ערכים (תמיד מחרוזות, כמו שהדפדפן מחזיר) + שגיאות לכל שדה, עם ניקוי שגיאה כשמתחילים לתקן */
export function useForm<V extends Record<string, string>>(initial: V) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<FormErrors<V>>({});

  return {
    values,
    errors,
    setValues,
    set: (field: keyof V, value: string) => {
      setValues((previous) => ({ ...previous, [field]: value }));
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    },
    /** מריץ ולידציה, מציג את השגיאות, ומחזיר true אם הטופס תקין */
    validate: (validator: (values: V) => FormErrors<V>) => {
      const found = validator(values);
      setErrors(found);
      return Object.keys(found).length === 0;
    },
    reset: (next: V = initial) => {
      setValues(next);
      setErrors({});
    },
  };
}

/**
 * ערכי טופס מישות: כל שדה הופך למחרוזת, ושדה חסר מקבל את ברירת המחדל של הטופס.
 * מחליף ממיר נפרד לכל טופס.
 */
export function toFormValues<V extends Record<string, string>>(defaults: V, entity: object): V {
  const source = entity as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const value = source[key];
      return [key, value === undefined || value === null ? fallback : String(value)];
    })
  ) as V;
}

/** FormApi לערכים שמנוהלים במקום אחר (טפסים מקוננים), בלי שגיאות לכל שדה */
export const formApi = <V,>(values: V, set: (field: keyof V, value: string) => void): FormApi<V> => ({
  values,
  errors: {},
  set,
});
