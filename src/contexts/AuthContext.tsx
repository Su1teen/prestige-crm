import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

export type UserRole = "HM" | "B2B" | "PATERHAUS" | "ADMIN";

export type WorkspaceId = "steppe" | "paterhaus";

export const PATERHAUS_ADMIN_EMAIL = "admin@paterhaus.com";

export const isPaterhausRole = (role: UserRole | null): boolean => role === "PATERHAUS" || role === "ADMIN";

export const workspaceForRole = (role: UserRole): WorkspaceId => (isPaterhausRole(role) ? "paterhaus" : "steppe");

export const workspacePathForRole = (role: UserRole): string => `/${workspaceForRole(role)}`;

interface AuthContextValue {
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  loginWithEmail: (email: string, password: string) => UserRole | null;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AUTH_ROLE_STORAGE_KEY = "steppe-crm-role";

const AuthContext = createContext<AuthContextValue | null>(null);

const getStoredRole = (): UserRole | null => {
  const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  return storedRole === "HM" || storedRole === "B2B" || storedRole === "PATERHAUS" || storedRole === "ADMIN"
    ? storedRole
    : null;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [role, setRole] = useState<UserRole | null>(getStoredRole);

  const setActiveRole = (nextRole: UserRole) => {
    localStorage.setItem(AUTH_ROLE_STORAGE_KEY, nextRole);
    setRole(nextRole);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    setRole(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isAuthenticated: role !== null,
      login: setActiveRole,
      loginWithEmail: (email: string, password: string): UserRole | null => {
        if (email.trim().toLowerCase() !== PATERHAUS_ADMIN_EMAIL || !password.trim()) return null;
        setActiveRole("ADMIN");
        return "ADMIN";
      },
      logout,
      switchRole: setActiveRole,
    }),
    [role],
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
