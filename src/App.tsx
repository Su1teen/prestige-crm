import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, workspacePathForRole } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PaterhausCRM from "./pages/PaterhausCRM.tsx";
import SteppeHotelCRM from "./pages/SteppeHotelCRM.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const workspacePath = role ? workspacePathForRole(role) : "/";

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={workspacePath} replace /> : <LoginPage />} />
      <Route
        path="/steppe/*"
        element={
          isAuthenticated && role !== "PATERHAUS" ? <SteppeHotelCRM onLogout={logout} /> : <Navigate to={isAuthenticated ? workspacePath : "/"} replace />
        }
      />
      <Route
        path="/paterhaus/*"
        element={
          isAuthenticated && role === "PATERHAUS" ? <PaterhausCRM onLogout={logout} /> : <Navigate to={isAuthenticated ? workspacePath : "/"} replace />
        }
      />
      <Route path="/luxe" element={<Navigate to={isAuthenticated ? workspacePath : "/"} replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
