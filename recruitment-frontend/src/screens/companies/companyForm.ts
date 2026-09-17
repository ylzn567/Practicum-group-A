import type { Company } from "../../types/company";

export interface CompanyFormValues {
  name: string;
  companyIdNumber: string;
  contactEmail: string;
}

export type CompanyFormErrors = Partial<Record<keyof CompanyFormValues, string>>;

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: "",
  companyIdNumber: "",
  contactEmail: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_ID_PATTERN = /^\d{9}$/;

export function companyToForm(company: Company): CompanyFormValues {
  return {
    name: company.name ?? "",
    companyIdNumber: company.companyIdNumber ?? "",
    contactEmail: company.contactEmail ?? "",
  };
}

export function validateCompanyForm(values: CompanyFormValues): CompanyFormErrors {
  const errors: CompanyFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "יש להזין שם חברה";
  }

  // ח.פ. בישראל הוא בן 9 ספרות. השדה עצמו אופציונלי.
  if (values.companyIdNumber.trim() && !COMPANY_ID_PATTERN.test(values.companyIdNumber.trim())) {
    errors.companyIdNumber = "מספר ח.פ. חייב להיות 9 ספרות";
  }

  if (values.contactEmail.trim() && !EMAIL_PATTERN.test(values.contactEmail.trim())) {
    errors.contactEmail = "כתובת האימייל אינה תקינה";
  }

  return errors;
}

export function companyToPayload(values: CompanyFormValues): Partial<Company> {
  const text = (value: string) => (value.trim() ? value.trim() : undefined);

  return {
    name: values.name.trim(),
    companyIdNumber: text(values.companyIdNumber),
    contactEmail: text(values.contactEmail)?.toLowerCase(),
  };
}
