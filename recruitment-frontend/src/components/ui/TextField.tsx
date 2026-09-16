import type { InputHTMLAttributes } from "react";
import { useId } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`ui-field__input ${error ? "ui-field__input--error" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <span className="ui-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
