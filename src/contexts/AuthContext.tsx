import { createContext, useCallback, useEffect, useRef, type ReactNode, useContext, useMemo, useState } from "react";
import { fetchPaterhausSessionUser, getPaterhausSession, loginPaterhaus, resetPaterhausConversationAccess, setPaterhausSession } from "@/lib/paterhausConversationsApi";

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
  /** Paterhaus password verification is delegated to the backend. */
  password?: string;
}

const CREDENTIALS: Record<string, CredentialEntry> = {
  // CosmonautHM
  "admin@cosmonaut.com": { workspace: "cosmonaut", role: "admin", passwordRequired: false },
  // B2B Sales
  "admin@sales.com": { workspace: "b2b", role: "admin", passwordRequired: false },
  // Paterhaus Admin
  "info@paterhaus.com": { workspace: "paterhaus", role: "admin", passwordRequired: true },
  // Paterhaus Marketing
  "r_tszi@paterhaus.com": { workspace: "paterhaus", role: "marketing", passwordRequired: true },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  authReady: boolean;
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
    // For paterhaus, only restore the user object if a session token also exists
    if (parsed.workspace === "paterhaus") {
      const hasToken = Boolean(localStorage.getItem("paterhaus:session") ?? sessionStorage.getItem("paterhaus:session"));
      if (!hasToken) return null;
    }
    return { email: parsed.email, workspace: parsed.workspace, role: parsed.role };
  } catch {
    return null;
  }
};

export const workspacePath = (workspace: WorkspaceId): string => `/${workspace}`;

export const isPaterhausWorkspace = (workspace: WorkspaceId | null): boolean => workspace === "paterhaus";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const hasSession = Boolean(localStorage.getItem("paterhaus:session") ?? sessionStorage.getItem("paterhaus:session"));
  const [authReady, setAuthReady] = useState(!hasSession);
  const authVersion = useRef(0);

  useEffect(() => {
    if (!getPaterhausSession()) return;
    const version = ++authVersion.current;
    fetchPaterhausSessionUser()
      .then((account) => {
        if (version === authVersion.current) setUser({
          email: account.email, role: account.role === "ADMIN" ? "admin" : "marketing", workspace: "paterhaus",
        });
      })
      .catch(() => {
        if (version === authVersion.current) setPaterhausSession(null);
      })
      .finally(() => { if (version === authVersion.current) setAuthReady(true); });
  }, []);

  const persist = useCallback((nextUser: AuthUser | null) => {
    if (nextUser) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser | null> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!password.trim()) return null;
      if (normalizedEmail.endsWith("@paterhaus.com")) {
        try {
          const result = await loginPaterhaus(normalizedEmail, password);
          authVersion.current++;
          setPaterhausSession(result.accessToken);
          resetPaterhausConversationAccess();
          const nextUser: AuthUser = {
            email: result.user.email,
            workspace: "paterhaus",
            role: result.user.role === "ADMIN" ? "admin" : "marketing",
          };
          persist(nextUser);
          setAuthReady(true);
          return nextUser;
        } catch {
          return null;
        }
      }
      const entry = CREDENTIALS[normalizedEmail];
      if (!entry || entry.workspace === "paterhaus") return null;
      const nextUser: AuthUser = { email: normalizedEmail, workspace: entry.workspace, role: entry.role };
      persist(nextUser);
      return nextUser;
    },
    [persist],
  );

  const logout = useCallback(() => {
    authVersion.current++;
    setPaterhausSession(null);
    resetPaterhausConversationAccess();
    setAuthReady(true);
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, authReady, isAuthenticated: user !== null, login, logout }),
    [user, authReady, login, logout],
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
