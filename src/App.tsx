import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import SteppeHotelCRM from "./pages/SteppeHotelCRM.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/steppe" replace /> : <LoginPage />} />
      <Route
        path="/steppe/*"
        element={isAuthenticated ? <SteppeHotelCRM onLogout={logout} /> : <Navigate to="/" replace />}
      />
      <Route path="/luxe" element={<Navigate to={isAuthenticated ? "/steppe" : "/"} replace />} />
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
