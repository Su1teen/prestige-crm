import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

export type UserRole = "HM" | "B2B";

interface AuthContextValue {
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
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
  return storedRole === "HM" || storedRole === "B2B" ? storedRole : null;
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
