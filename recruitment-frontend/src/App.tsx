import { useState } from "react";
import type { ReactNode } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { NavigateFunction, Params } from "react-router-dom";
import { Button, Card, Heading, Text } from "./design-system/components";
import DesignSystemPreview from "./design-system/DesignSystemPreview";
import { AuthScreen } from "./screens/auth/AuthScreen";
import { CategoriesListScreen } from "./screens/categories/CategoriesListScreen";
import { CategoryEditorScreen } from "./screens/categories/CategoryEditorScreen";
import { CompaniesScreen } from "./screens/companies/CompaniesScreen";
import { MapalImportScreen } from "./screens/positions/MapalImportScreen";
import { PositionDetailScreen } from "./screens/positions/PositionDetailScreen";
import { PositionFormScreen } from "./screens/positions/PositionFormScreen";
import { PositionsListScreen } from "./screens/positions/PositionsListScreen";
import { StagesBuilderScreen } from "./screens/stages/StagesBuilderScreen";
import { logout } from "./services/auth.service";
import type { AuthUser } from "./types/auth";

/**
 * עוקף זמני: כל עוד אין endpoints של התחברות (קבוצה ג׳), /?dev=1 פותח
 * את המסכים בלי משתמש. נשמר ב-sessionStorage כדי לשרוד ניווט בין נתיבים.
 * למחוק את הפונקציה ואת השימושים בה ברגע שההתחברות עובדת.
 */
const DEV_KEY = "recruitment.devBypass";

function isDevBypass(): boolean {
  if (new URLSearchParams(window.location.search).has("dev")) {
    sessionStorage.setItem(DEV_KEY, "1");
  }
  return sessionStorage.getItem(DEV_KEY) === "1";
}

// ===== נתיבים =====
// המסכים מקבלים callbacks ולא תלויים ב-router, וכאן הם מחוברים לנתיבים. טבלה אחת במקום עטיפה לכל נתיב.

type AppRoute = {
  path: string;
  render: (go: NavigateFunction, params: Readonly<Params>) => ReactNode;
};

const ROUTES: AppRoute[] = [
  {
    path: "/positions",
    render: (go) => (
      <PositionsListScreen
        onOpenPosition={(id) => go(`/positions/${id}`)}
        onCreatePosition={() => go("/positions/new")}
        onImportMapal={() => go("/positions/import")}
      />
    ),
  },
  {
    path: "/positions/new",
    render: (go) => (
      <PositionFormScreen onSaved={(id) => go(`/positions/${id}`)} onCancel={() => go("/positions")} />
    ),
  },
  {
    path: "/positions/import",
    render: (go) => (
      <MapalImportScreen onCreated={(id) => go(`/positions/${id}`)} onCancel={() => go("/positions")} />
    ),
  },
  {
    path: "/positions/:positionId",
    render: (go, { positionId = "" }) => (
      <PositionDetailScreen
        positionId={positionId}
        onEdit={() => go(`/positions/${positionId}/edit`)}
        onOpenStages={() => go(`/positions/${positionId}/stages`)}
        onBack={() => go("/positions")}
      />
    ),
  },
  {
    path: "/positions/:positionId/edit",
    render: (go, { positionId = "" }) => (
      <PositionFormScreen
        positionId={positionId}
        onSaved={(id) => go(`/positions/${id}`)}
        onCancel={() => go(`/positions/${positionId}`)}
      />
    ),
  },
  {
    path: "/positions/:positionId/stages",
    render: (go, { positionId = "" }) => (
      <StagesBuilderScreen positionId={positionId} onBack={() => go(`/positions/${positionId}`)} />
    ),
  },
  {
    path: "/categories",
    render: (go) => (
      <CategoriesListScreen
        onCreate={() => go("/categories/new")}
        onEdit={(id) => go(`/categories/${id}/edit`)}
        onBack={() => go("/positions")}
      />
    ),
  },
  {
    path: "/categories/new",
    render: (go) => <CategoryEditorScreen onSaved={() => go("/categories")} onCancel={() => go("/categories")} />,
  },
  {
    path: "/categories/:categoryId/edit",
    render: (go, { categoryId }) => (
      <CategoryEditorScreen
        key={categoryId}
        categoryId={categoryId}
        onSaved={() => go("/categories")}
        onCancel={() => go("/categories")}
      />
    ),
  },
  { path: "/companies", render: (go) => <CompaniesScreen onBack={() => go("/positions")} /> },
  {
    path: "*",
    render: (go) => (
      <div className="page">
        <Card>
          <Heading level={3}>הדף לא נמצא</Heading>
          <Text>הכתובת שהגעת אליה לא קיימת במערכת.</Text>
          <div className="page__actions" style={{ marginTop: 16 }}>
            <Button onClick={() => go("/positions")}>חזרה למשרות</Button>
          </div>
        </Card>
      </div>
    ),
  },
];

/** מחבר מסך לנתיב: מספק לו ניווט ופרמטרים של הכתובת */
function Routed({ render }: { render: AppRoute["render"] }) {
  return <>{render(useNavigate(), useParams())}</>;
}

// ===== מעטפת האפליקציה =====

const NAV_LINKS = [
  { to: "/positions", label: "משרות" },
  { to: "/categories", label: "קטגוריות" },
  { to: "/companies", label: "חברות" },
];

function AppShell({ user, onLogout, children }: { user: AuthUser | null; onLogout: () => void; children: ReactNode }) {
  return (
    <>
      <header className="app-bar">
        <span className="app-bar__user">{user?.name ?? "מצב פיתוח"}</span>
        <nav className="app-bar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} className="app-bar__link" to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="secondary" onClick={onLogout}>
          יציאה
        </Button>
      </header>
      {children}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user) || isDevBypass();

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem(DEV_KEY);
    setUser(null);
    navigate("/login");
  };

  return (
    <Routes>
      {/* מסך התצוגה של מערכת העיצוב: לפיתוח בלבד, בלי מעטפת ובלי הרשאה */}
      <Route path="/design-system" element={<DesignSystemPreview />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/positions" replace />
          ) : (
            <AuthScreen
              onAuthenticated={(authUser) => {
                setUser(authUser);
                navigate("/positions");
              }}
            />
          )
        }
      />

      <Route
        path="*"
        element={
          isAuthenticated ? (
            <AppShell user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/positions" replace />} />
                {ROUTES.map(({ path, render }) => (
                  <Route key={path} path={path} element={<Routed render={render} />} />
                ))}
              </Routes>
            </AppShell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
