import { createContext, useCallback, type ReactNode, useContext, useMemo, useState } from "react";

export type WorkspaceId = "cosmonaut" | "b2b" | "paterhaus" | "steppe";

export type UserRole = "admin" | "marketing" | "manager";

export interface AuthUser {
  email: string;
  workspace: WorkspaceId;
  role: UserRole;
}

interface CredentialEntry {
  workspace: WorkspaceId;
  role: UserRole;
  /** When false, any non-empty password is accepted. */
  passwordRequired: boolean;
  /** Exact password match required when `passwordRequired` is true. */
  password?: string;
}

const CREDENTIALS: Record<string, CredentialEntry> = {
  // CosmonautHM
  "admin@cosmonaut.com": { workspace: "cosmonaut", role: "admin", passwordRequired: false },
  // B2B Sales
  "admin@sales.com": { workspace: "b2b", role: "admin", passwordRequired: false },
  // Paterhaus Admin
  "info@paterhaus.com": {
    workspace: "paterhaus",
    role: "admin",
    passwordRequired: true,
    password: "admin2026_pater",
  },
  // Paterhaus Marketing
  "r_tszi@paterhaus.com": {
    workspace: "paterhaus",
    role: "marketing",
    passwordRequired: true,
    password: "Paterhaus_2026",
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => AuthUser | null;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AUTH_USER_STORAGE_KEY = "smart-crm-user";

const AuthContext = createContext<AuthContextValue | null>(null);

const isWorkspace = (value: string): value is WorkspaceId =>
  value === "cosmonaut" || value === "b2b" || value === "paterhaus" || value === "steppe";

const isRole = (value: string): value is UserRole =>
  value === "admin" || value === "marketing" || value === "manager";

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { workspace?: string; role?: string };
    if (!parsed.email || !parsed.workspace || !parsed.role) return null;
    if (!isWorkspace(parsed.workspace) || !isRole(parsed.role)) return null;
    return { email: parsed.email, workspace: parsed.workspace, role: parsed.role };
  } catch {
    return null;
  }
};

export const workspacePath = (workspace: WorkspaceId): string => `/${workspace}`;

export const isPaterhausWorkspace = (workspace: WorkspaceId | null): boolean => workspace === "paterhaus";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const persist = useCallback((nextUser: AuthUser | null) => {
    if (nextUser) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    setUser(nextUser);
  }, []);

  const login = useCallback(
    (email: string, password: string): AuthUser | null => {
      const normalizedEmail = email.trim().toLowerCase();
      const entry = CREDENTIALS[normalizedEmail];
      if (!entry) return null;
      if (!password.trim()) return null;
      if (entry.passwordRequired && entry.password !== password) return null;
      const nextUser: AuthUser = {
        email: normalizedEmail,
        workspace: entry.workspace,
        role: entry.role,
      };
      persist(nextUser);
      return nextUser;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
