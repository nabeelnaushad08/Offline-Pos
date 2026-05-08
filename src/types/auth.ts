// Auth types used in the renderer process
// Mirror of SanitizedUser from electron/ipc/auth.handler.ts

export interface AuthRole {
  id: string;
  name: string;
  displayName: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  status: string;
  avatar: string | null;
  roleId: string;
  lastLoginAt: string | null;
  role: AuthRole;
}

export interface AuthSession {
  user: AuthUser;
  permissions: string[];
  loginAt: string; // ISO timestamp
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  permissions?: string[];
  error?: string;
}

export interface ValidateSessionResult {
  valid: boolean;
  user?: AuthUser;
  permissions?: string[];
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}
