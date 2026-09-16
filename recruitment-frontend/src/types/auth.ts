// מתאים ל-User של קבוצה ג׳: email, name, authorizationId, isActive

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  authorizationId?: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
