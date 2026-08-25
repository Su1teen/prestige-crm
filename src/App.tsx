import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AuthProvider,
  isPaterhausWorkspace,
  useAuth,
  workspacePath,
  type WorkspaceId,
} from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PaterhausCRM from "./pages/PaterhausCRM.tsx";
import SteppeHotelCRM from "./pages/SteppeHotelCRM.tsx";

const queryClient = new QueryClient();

const STEPPE_WORKSPACES: WorkspaceId[] = ["cosmonaut", "b2b", "steppe"];
const isSteppeWorkspace = (workspace: WorkspaceId | null): boolean =>
  workspace !== null && STEPPE_WORKSPACES.includes(workspace);

const AppRoutes = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const workspace = user?.workspace ?? null;
  const homePath = workspace ? workspacePath(workspace) : "/";

  const renderSteppe = () =>
    isAuthenticated && isSteppeWorkspace(workspace) ? (
      <SteppeHotelCRM onLogout={logout} />
    ) : (
      <Navigate to={isAuthenticated ? homePath : "/"} replace />
    );

  const renderPaterhaus = () =>
    isAuthenticated && isPaterhausWorkspace(workspace) ? (
      <PaterhausCRM onLogout={logout} />
    ) : (
      <Navigate to={isAuthenticated ? homePath : "/"} replace />
    );

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />} />
      <Route path="/cosmonaut/*" element={renderSteppe()} />
      <Route path="/b2b/*" element={renderSteppe()} />
      <Route path="/steppe/*" element={renderSteppe()} />
      <Route path="/paterhaus/*" element={renderPaterhaus()} />
      <Route path="/luxe" element={<Navigate to={isAuthenticated ? homePath : "/"} replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
