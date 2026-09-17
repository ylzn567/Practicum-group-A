import { apiRequest } from "./api";
import type { JobCategory } from "../types/jobCategory";

export function getJobCategories(): Promise<JobCategory[]> {
  return apiRequest<JobCategory[]>("/job-categories");
}

export function getJobCategoryById(id: string): Promise<JobCategory> {
  return apiRequest<JobCategory>(`/job-categories/${id}`);
}

export function createJobCategory(data: Partial<JobCategory>): Promise<JobCategory> {
  return apiRequest<JobCategory>("/job-categories", { method: "POST", body: data });
}

export function updateJobCategory(
  id: string,
  data: Partial<JobCategory>
): Promise<JobCategory> {
  return apiRequest<JobCategory>(`/job-categories/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteJobCategory(id: string): Promise<void> {
  return apiRequest<void>(`/job-categories/${id}`, { method: "DELETE" });
}
