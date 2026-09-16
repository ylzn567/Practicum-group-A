import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
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
      <section className="auth__card">
        <header className="auth__header">
          <h1 className="auth__title">מערכת הגיוס</h1>
          <p className="auth__subtitle">
            {isRegister
              ? "יצירת משתמש חדש לצוות המשרד"
              : "כניסה למערכת עם פרטי המשתמש שלך"}
          </p>
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
            <div className="ui-alert ui-alert--error" role="alert">
              {serverError}
            </div>
          )}

          {isRegister && (
            <TextField
              label="שם מלא"
              value={values.name}
              error={errors.name}
              autoComplete="name"
              onChange={(e) => updateField("name", e.target.value)}
            />
          )}

          <TextField
            label="אימייל"
            type="email"
            dir="ltr"
            value={values.email}
            error={errors.email}
            autoComplete="email"
            onChange={(e) => updateField("email", e.target.value)}
          />

          <TextField
            label="סיסמה"
            type="password"
            value={values.password}
            error={errors.password}
            autoComplete={isRegister ? "new-password" : "current-password"}
            onChange={(e) => updateField("password", e.target.value)}
          />

          {isRegister && (
            <TextField
              label="אימות סיסמה"
              type="password"
              value={values.confirmPassword}
              error={errors.confirmPassword}
              autoComplete="new-password"
              onChange={(e) => updateField("confirmPassword", e.target.value)}
            />
          )}

          <Button type="submit" block disabled={isSubmitting}>
            {isSubmitting ? "רגע..." : isRegister ? "הרשמה" : "כניסה"}
          </Button>
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
      </section>
    </main>
  );
}
