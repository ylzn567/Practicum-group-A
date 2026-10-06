import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Field, Input, Select, Textarea } from "../design-system/components";
import type { FormApi } from "../hooks/useForm";

export type Option = { value: string; label: string };

/** { KEY: "תווית" } -> אפשרויות לרשימה נפתחת */
export const toOptions = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** האפשרויות של <select>, עם אפשרות ריקה ראשונה אם יש placeholder */
export function Options({ options, placeholder }: { options: Option[]; placeholder?: string }) {
  return (
    <>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );
}

type FieldProps<V> = {
  form: FormApi<V>;
  name: keyof V & string;
  label: string;
  hint?: string;
};

/** שדה של מערכת העיצוב, עם מצב שגיאה: ההודעה מחליפה את הרמז ומתחתיה הקצה נצבע */
export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={error ? "form-invalid" : undefined}>
      <Field label={label} hint={error ?? hint}>
        {children}
      </Field>
    </div>
  );
}

export function InputField<V extends Record<string, string>>({
  form,
  name,
  label,
  hint,
  ...rest
}: FieldProps<V> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "form" | "name" | "value" | "onChange">) {
  return (
    <FormField label={label} error={form.errors[name]} hint={hint}>
      <Input
        {...rest}
        value={form.values[name]}
        aria-invalid={Boolean(form.errors[name])}
        onChange={(e) => form.set(name, e.target.value)}
      />
    </FormField>
  );
}

export function TextAreaField<V extends Record<string, string>>({
  form,
  name,
  label,
  hint,
  ...rest
}: FieldProps<V> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "form" | "name" | "value" | "onChange">) {
  return (
    <FormField label={label} error={form.errors[name]} hint={hint}>
      <Textarea
        {...rest}
        value={form.values[name]}
        onChange={(e) => form.set(name, e.target.value)}
      />
    </FormField>
  );
}

export function SelectField<V extends Record<string, string>>({
  form,
  name,
  label,
  hint,
  options,
  placeholder,
}: FieldProps<V> & { options: Option[]; placeholder?: string }) {
  return (
    <FormField label={label} error={form.errors[name]} hint={hint}>
      <Select
        value={form.values[name]}
        aria-invalid={Boolean(form.errors[name])}
        onChange={(e) => form.set(name, e.target.value)}
      >
        <Options options={options} placeholder={placeholder} />
      </Select>
    </FormField>
  );
}

/** הודעת שגיאה כללית (מהשרת) מעל טופס או מסך. לא מציג כלום אם אין שגיאה */
export function ErrorAlert({ message }: { message: string | null }) {
  return message ? (
    <p className="form-alert" role="alert">
      {message}
    </p>
  ) : null;
}
