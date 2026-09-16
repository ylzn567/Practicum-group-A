export type AuthMode = "login" | "register";

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateAuthForm(
  values: AuthFormValues,
  mode: AuthMode
): AuthFormErrors {
  const errors: AuthFormErrors = {};

  if (mode === "register" && values.name.trim().length < 2) {
    errors.name = "יש להזין שם מלא";
  }

  if (!values.email.trim()) {
    errors.email = "יש להזין כתובת אימייל";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "כתובת האימייל אינה תקינה";
  }

  if (!values.password) {
    errors.password = "יש להזין סיסמה";
  } else if (mode === "register" && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  }

  if (mode === "register" && values.confirmPassword !== values.password) {
    errors.confirmPassword = "הסיסמאות אינן תואמות";
  }

  return errors;
}
