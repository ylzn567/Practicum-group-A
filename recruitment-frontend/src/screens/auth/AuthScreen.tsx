import { useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  Text,
} from "../../design-system/components";
import { login, register } from "../../services/auth.service";
import type { AuthUser } from "../../types/auth";
import { validateAuthForm } from "./validation";
import type { AuthFormErrors, AuthFormValues, AuthMode } from "./validation";
import "./AuthScreen.css";

const EMPTY_FORM: AuthFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type AuthScreenProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [values, setValues] = useState<AuthFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  function switchMode(next: AuthMode) {
    setMode(next);
    setValues(EMPTY_FORM);
    setErrors({});
    setServerError(null);
  }

  function updateField(field: keyof AuthFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // מנקים את השגיאה של השדה ברגע שמתחילים לתקן אותו
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const validationErrors = validateAuthForm(values, mode);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const email = values.email.trim().toLowerCase();
      const result = isRegister
        ? await register({ name: values.name.trim(), email, password: values.password })
        : await login({ email, password: values.password });

      onAuthenticated(result.user);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth__card">
        <Card>
          <header className="auth__header">
            <Heading level={1}>מערכת הגיוס</Heading>
            <Text>
              {isRegister
                ? "יצירת משתמש חדש לצוות המשרד"
                : "כניסה למערכת עם פרטי המשתמש שלך"}
            </Text>
          </header>

          <div className="auth__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={`auth__tab ${!isRegister ? "auth__tab--active" : ""}`}
              onClick={() => switchMode("login")}
            >
              כניסה
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={`auth__tab ${isRegister ? "auth__tab--active" : ""}`}
              onClick={() => switchMode("register")}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {serverError && (
              <p className="auth__alert" role="alert">
                {serverError}
              </p>
            )}

            {isRegister && (
              <div className={errors.name ? "auth__invalid" : undefined}>
                <Field label="שם מלא" hint={errors.name}>
                  <Input
                    value={values.name}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </Field>
              </div>
            )}

            <div className={errors.email ? "auth__invalid" : undefined}>
              <Field label="אימייל" hint={errors.email}>
                <Input
                  type="email"
                  dir="ltr"
                  value={values.email}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </Field>
            </div>

            <div className={errors.password ? "auth__invalid" : undefined}>
              <Field label="סיסמה" hint={errors.password}>
                <Input
                  type="password"
                  value={values.password}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(e) => updateField("password", e.target.value)}
                />
              </Field>
            </div>

            {isRegister && (
              <div className={errors.confirmPassword ? "auth__invalid" : undefined}>
                <Field label="אימות סיסמה" hint={errors.confirmPassword}>
                  <Input
                    type="password"
                    value={values.confirmPassword}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                  />
                </Field>
              </div>
            )}

            <div className="auth__submit">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "רגע..." : isRegister ? "הרשמה" : "כניסה"}
              </Button>
            </div>
          </form>

          {isRegister && (
            <p className="auth__note">
              משתמש חדש נוצר ללא הרשאות. מנהל המערכת משייך לך פרופיל הרשאות לפני
              הכניסה הראשונה.
            </p>
          )}

          <p className="auth__switch">
            {isRegister ? "יש לך כבר משתמש?" : "אין לך עדיין משתמש?"}{" "}
            <button
              type="button"
              className="auth__link"
              onClick={() => switchMode(isRegister ? "login" : "register")}
            >
              {isRegister ? "כניסה" : "הרשמה"}
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}
