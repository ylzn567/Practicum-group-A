import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorAlert, InputField } from "../../components/FormFields";
import { Button, Card, Heading, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { login, register } from "../../services/auth.service";
import type { AuthUser } from "../../types/auth";
import { EMPTY_AUTH_FORM, validateAuthForm } from "./validation";
import type { AuthMode } from "./validation";
import "./AuthScreen.css";

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: "login", label: "כניסה" },
  { mode: "register", label: "הרשמה" },
];

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const form = useForm(EMPTY_AUTH_FORM);
  const action = useAction();
  const isRegister = mode === "register";

  const switchMode = (next: AuthMode) => {
    setMode(next);
    form.reset();
    action.setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate((values) => validateAuthForm(values, mode))) return;

    const { name, email, password } = form.values;
    const credentials = { email: email.trim().toLowerCase(), password };
    action.run(async () => {
      const result = isRegister
        ? await register({ ...credentials, name: name.trim() })
        : await login(credentials);
      onAuthenticated(result.user);
    });
  };

  return (
    <main className="auth">
      <div className="auth__card">
        <Card>
          <header className="auth__header">
            <Heading level={1}>מערכת הגיוס</Heading>
            <Text>
              {isRegister ? "יצירת משתמש חדש לצוות המשרד" : "כניסה למערכת עם פרטי המשתמש שלך"}
            </Text>
          </header>

          <div className="auth__tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.mode}
                type="button"
                role="tab"
                aria-selected={mode === tab.mode}
                className={`auth__tab ${mode === tab.mode ? "auth__tab--active" : ""}`}
                onClick={() => switchMode(tab.mode)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <ErrorAlert message={action.error} />

            {isRegister && <InputField form={form} name="name" label="שם מלא" autoComplete="name" />}
            <InputField form={form} name="email" label="אימייל" type="email" dir="ltr" autoComplete="email" />
            <InputField
              form={form}
              name="password"
              label="סיסמה"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {isRegister && (
              <InputField
                form={form}
                name="confirmPassword"
                label="אימות סיסמה"
                type="password"
                autoComplete="new-password"
              />
            )}

            <div className="auth__submit">
              <Button type="submit" disabled={action.isRunning}>
                {action.isRunning ? "רגע..." : isRegister ? "הרשמה" : "כניסה"}
              </Button>
            </div>
          </form>

          {isRegister && (
            <p className="auth__note">
              משתמש חדש נוצר ללא הרשאות. מנהל המערכת משייך לך פרופיל הרשאות לפני הכניסה הראשונה.
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
