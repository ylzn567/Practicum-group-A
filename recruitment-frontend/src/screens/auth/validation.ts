import type { FormErrors } from "../../hooks/useForm";
import { EMAIL_PATTERN, onlyErrors } from "../../utils/validation";

export type AuthMode = "login" | "register";

export interface AuthFormValues extends Record<string, string> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const EMPTY_AUTH_FORM: AuthFormValues = { name: "", email: "", password: "", confirmPassword: "" };

const MIN_PASSWORD_LENGTH = 8;

/** שם, חוזק סיסמה ואימות נבדקים רק בהרשמה. בכניסה מספיק שהשדות מלאים */
export const validateAuthForm = (
  values: AuthFormValues,
  mode: AuthMode
): FormErrors<AuthFormValues> => {
  const isRegister = mode === "register";
  const email = values.email.trim();

  return onlyErrors({
    name: isRegister && values.name.trim().length < 2 ? "יש להזין שם מלא" : undefined,
    email: !email
      ? "יש להזין כתובת אימייל"
      : !EMAIL_PATTERN.test(email)
        ? "כתובת האימייל אינה תקינה"
        : undefined,
    password: !values.password
      ? "יש להזין סיסמה"
      : isRegister && values.password.length < MIN_PASSWORD_LENGTH
        ? `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`
        : undefined,
    confirmPassword:
      isRegister && values.confirmPassword !== values.password ? "הסיסמאות אינן תואמות" : undefined,
  });
};
