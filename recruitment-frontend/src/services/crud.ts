import { apiRequest } from "./api";

/** CRUD לכל אוסף במקום אחד, כמו ה-Repository הגנרי בשרת */
export function createCrudService<T extends { _id: string }>(path: string) {
  return {
    /** params הם סינון בשרת, למשל { positionId } */
    getAll: (params?: Record<string, string>) =>
      apiRequest<T[]>(params ? `${path}?${new URLSearchParams(params)}` : path),
    getById: (id: string) => apiRequest<T>(`${path}/${id}`),
    create: (data: Partial<T>) => apiRequest<T>(path, { method: "POST", body: data }),
    update: (id: string, data: Partial<T>) =>
      apiRequest<T>(`${path}/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => apiRequest<void>(`${path}/${id}`, { method: "DELETE" }),
  };
}
