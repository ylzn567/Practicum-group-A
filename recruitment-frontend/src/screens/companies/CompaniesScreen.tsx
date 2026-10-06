import { useState } from "react";
import type { FormEvent } from "react";
import { ErrorAlert, InputField } from "../../components/FormFields";
import { LoadGate } from "../../components/LoadGate";
import { Button, Card, Heading, Table, Text } from "../../design-system/components";
import { useAction } from "../../hooks/useAction";
import { useForm } from "../../hooks/useForm";
import { useLoad } from "../../hooks/useLoad";
import { companiesApi } from "../../services/entities";
import type { Company } from "../../types/company";
import { formatText } from "../../utils/format";
import {
  EMPTY_COMPANY_FORM,
  companyToForm,
  companyToPayload,
  validateCompanyForm,
} from "./companyForm";
import "./CompaniesScreen.css";

export function CompaniesScreen({ onBack }: { onBack: () => void }) {
  const load = useLoad(() => companiesApi.getAll());
  const form = useForm(EMPTY_COMPANY_FORM);
  const action = useAction();
  // null = הטופס סגור, "new" = חברה חדשה, אחרת מזהה החברה בעריכה
  const [editing, setEditing] = useState<string | null>(null);

  const open = (company?: Company) => {
    form.reset(company ? companyToForm(company) : EMPTY_COMPANY_FORM);
    action.setError(null);
    setEditing(company?._id ?? "new");
  };

  const close = () => {
    form.reset();
    action.setError(null);
    setEditing(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate(validateCompanyForm)) return;

    const payload = companyToPayload(form.values);
    const saved = await action.run(() =>
      editing === "new" ? companiesApi.create(payload) : companiesApi.update(editing!, payload)
    );
    if (saved) {
      close();
      load.reload();
    }
  };

  const handleDelete = (company: Company) =>
    action.run(async () => {
      await companiesApi.remove(company._id);
      load.reload();
    }, `למחוק את "${company.name}"?`);

  return (
    <LoadGate load={load} loadingText="טוען חברות..." errorTitle="לא הצלחנו לטעון את החברות">
      {(companies) => (
        <div className="page">
          <header className="page__header">
            <div>
              <Heading level={1}>חברות וספקים</Heading>
              <Text>
                חברות הגיוס שמגישות מועמדים בשם המועמד. קבוצה ב׳ תשתמש ברשימה הזו במסך
                הגשת המועמדות.
              </Text>
            </div>
            <div className="page__actions">
              {editing === null && <Button onClick={() => open()}>חברה חדשה</Button>}
              <Button variant="secondary" onClick={onBack}>
                חזרה למשרות
              </Button>
            </div>
          </header>

          <ErrorAlert message={action.error} />

          {editing !== null && (
            <div className="companies__block">
              <Card>
                <Heading level={3}>{editing === "new" ? "חברה חדשה" : "עריכת חברה"}</Heading>
                <form onSubmit={handleSave} noValidate>
                  <div className="companies__grid">
                    <InputField
                      form={form}
                      name="name"
                      label="שם החברה *"
                      autoFocus
                      placeholder="לדוגמה: אבני דרך גיוס בע״מ"
                    />
                    <InputField
                      form={form}
                      name="companyIdNumber"
                      label="מספר ח.פ."
                      hint="9 ספרות"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="514736219"
                    />
                    <InputField
                      form={form}
                      name="contactEmail"
                      label="אימייל ליצירת קשר"
                      type="email"
                      dir="ltr"
                      placeholder="jobs@example.co.il"
                    />
                  </div>
                  <div className="page__actions">
                    <Button type="submit" disabled={action.isRunning}>
                      {action.isRunning ? "שומר..." : "שמירה"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={close}>
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
                <div className="page__actions">
                  <Button onClick={() => open()}>הוספת חברה</Button>
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
                        <div className="page__actions">
                          <Button variant="secondary" onClick={() => open(company)}>
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
      )}
    </LoadGate>
  );
}
