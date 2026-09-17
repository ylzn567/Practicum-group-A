import { apiRequest } from "./api";
import type { Company } from "../types/company";

export function getCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>("/companies");
}

export function createCompany(data: Partial<Company>): Promise<Company> {
  return apiRequest<Company>("/companies", { method: "POST", body: data });
}

export function updateCompany(id: string, data: Partial<Company>): Promise<Company> {
  return apiRequest<Company>(`/companies/${id}`, { method: "PUT", body: data });
}

export function deleteCompany(id: string): Promise<void> {
  return apiRequest<void>(`/companies/${id}`, { method: "DELETE" });
}
