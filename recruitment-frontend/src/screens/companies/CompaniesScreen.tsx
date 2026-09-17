import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  Table,
  Text,
} from "../../design-system/components";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "../../services/companies.service";
import type { Company } from "../../types/company";
import { formatText } from "../../utils/format";
import {
  EMPTY_COMPANY_FORM,
  companyToForm,
  companyToPayload,
  validateCompanyForm,
} from "./companyForm";
import type { CompanyFormErrors, CompanyFormValues } from "./companyForm";
import "./CompaniesScreen.css";

type CompaniesScreenProps = {
  onBack: () => void;
};

export function CompaniesScreen({ onBack }: CompaniesScreenProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // null = הטופס סגור, "new" = חברה חדשה, אחרת מזהה החברה בעריכה
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<CompanyFormValues>(EMPTY_COMPANY_FORM);
  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCompanies(await getCompanies());
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing("new");
    setValues(EMPTY_COMPANY_FORM);
    setErrors({});
    setFormError(null);
  }

  function openEdit(company: Company) {
    setEditing(company._id);
    setValues(companyToForm(company));
    setErrors({});
    setFormError(null);
  }

  function closeForm() {
    setEditing(null);
    setErrors({});
    setFormError(null);
  }

  function updateField(field: keyof CompanyFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateCompanyForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      const payload = companyToPayload(values);
      if (editing && editing !== "new") {
        await updateCompany(editing, payload);
      } else {
        await createCompany(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(company: Company) {
    if (!window.confirm(`למחוק את "${company.name}"?`)) return;
    setLoadError(null);
    try {
      await deleteCompany(company._id);
      await load();
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Card>
          <Text>טוען חברות...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Heading level={1}>חברות וספקים</Heading>
          <Text>
            חברות הגיוס שמגישות מועמדים בשם המועמד. קבוצה ב׳ תשתמש ברשימה הזו
            במסך הגשת המועמדות.
          </Text>
        </div>
        <div className="companies__actions">
          {editing === null && <Button onClick={openNew}>חברה חדשה</Button>}
          <Button variant="secondary" onClick={onBack}>
            חזרה למשרות
          </Button>
        </div>
      </header>

      {loadError && (
        <p className="form-alert" role="alert">
          {loadError}
        </p>
      )}

      {editing !== null && (
        <div className="companies__block">
          <Card>
            <Heading level={3}>
              {editing === "new" ? "חברה חדשה" : "עריכת חברה"}
            </Heading>

            <form onSubmit={handleSubmit} noValidate>
              {formError && (
                <p className="form-alert" role="alert">
                  {formError}
                </p>
              )}

              <div className="companies__grid">
                <div className={errors.name ? "form-invalid" : undefined}>
                  <Field label="שם החברה *" hint={errors.name}>
                    <Input
                      value={values.name}
                      autoFocus
                      placeholder="לדוגמה: אבני דרך גיוס בע״מ"
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                  </Field>
                </div>

                <div className={errors.companyIdNumber ? "form-invalid" : undefined}>
                  <Field
                    label="מספר ח.פ."
                    hint={errors.companyIdNumber ?? "9 ספרות"}
                  >
                    <Input
                      value={values.companyIdNumber}
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="514736219"
                      onChange={(e) => updateField("companyIdNumber", e.target.value)}
                    />
                  </Field>
                </div>

                <div className={errors.contactEmail ? "form-invalid" : undefined}>
                  <Field label="אימייל ליצירת קשר" hint={errors.contactEmail}>
                    <Input
                      type="email"
                      dir="ltr"
                      value={values.contactEmail}
                      placeholder="jobs@example.co.il"
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="companies__actions">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמירה"}
                </Button>
                <Button type="button" variant="secondary" onClick={closeForm}>
                  ביטול
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {companies.length === 0 ? (
        <Card>
          <Heading level={3}>אין עדיין חברות במערכת</Heading>
          <Text>הוסיפו את חברת הגיוס הראשונה.</Text>
          {editing === null && (
            <div className="companies__actions">
              <Button onClick={openNew}>הוספת חברה</Button>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>שם החברה</th>
                <th>ח.פ.</th>
                <th>אימייל</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company._id}>
                  <td>{company.name}</td>
                  <td className="num" dir="ltr">
                    {formatText(company.companyIdNumber)}
                  </td>
                  <td dir="ltr">{formatText(company.contactEmail)}</td>
                  <td>
                    <div className="companies__actions">
                      <Button variant="secondary" onClick={() => openEdit(company)}>
                        עריכה
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(company)}>
                        מחיקה
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
