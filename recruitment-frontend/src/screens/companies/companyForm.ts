import { toFormValues } from "../../hooks/useForm";
import type { FormErrors } from "../../hooks/useForm";
import type { Company } from "../../types/company";
import { EMAIL_PATTERN, onlyErrors, text } from "../../utils/validation";

export interface CompanyFormValues extends Record<string, string> {
  name: string;
  companyIdNumber: string;
  contactEmail: string;
}

export const EMPTY_COMPANY_FORM: CompanyFormValues = { name: "", companyIdNumber: "", contactEmail: "" };

export const companyToForm = (company: Company) => toFormValues(EMPTY_COMPANY_FORM, company);

// ח.פ. בישראל הוא בן 9 ספרות. ח.פ. ואימייל אופציונליים.
export const validateCompanyForm = (values: CompanyFormValues): FormErrors<CompanyFormValues> =>
  onlyErrors({
    name: values.name.trim().length < 2 ? "יש להזין שם חברה" : undefined,
    companyIdNumber:
      values.companyIdNumber.trim() && !/^\d{9}$/.test(values.companyIdNumber.trim())
        ? "מספר ח.פ. חייב להיות 9 ספרות"
        : undefined,
    contactEmail:
      values.contactEmail.trim() && !EMAIL_PATTERN.test(values.contactEmail.trim())
        ? "כתובת האימייל אינה תקינה"
        : undefined,
  });

export const companyToPayload = (values: CompanyFormValues): Partial<Company> => ({
  name: values.name.trim(),
  companyIdNumber: text(values.companyIdNumber),
  contactEmail: text(values.contactEmail)?.toLowerCase(),
});
