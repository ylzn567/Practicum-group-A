import { apiRequest, clearToken, setToken } from "./api";
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "../types/auth";

/**
 * ה-endpoints האלה באחריות קבוצה ג׳ (הרשאות) בצד השרת:
 *   POST /api/auth/register  -> { token, user }
 *   POST /api/auth/login     -> { token, user }
 *   GET  /api/auth/me        -> user   (לפי הטוקן)
 * עד שהם קיימים — המסך יציג את הודעת השגיאה שמגיעה מהשרת.
 */

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
  setToken(result.token);
  return result;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  setToken(result.token);
  return result;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me");
}

export function logout(): void {
  clearToken();
}
