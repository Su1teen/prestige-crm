import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LoginPage, { type SessionUser } from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import SteppeHotelCRM from "./pages/SteppeHotelCRM.tsx";

const queryClient = new QueryClient();

const getInitialSession = (): SessionUser | null => {
  const stored = window.localStorage.getItem("prestige-crm-user");

  return stored === "sultan" || stored === "ruslan" ? stored : null;
};

const App = () => {
  const [session, setSession] = useState<SessionUser | null>(getInitialSession);

  const handleLogin = (user: SessionUser) => {
    window.localStorage.setItem("prestige-crm-user", user);
    setSession(user);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("prestige-crm-user");
    setSession(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                session ? (
                  <Navigate to={session === "sultan" ? "/luxe" : "/steppe"} replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/luxe"
              element={
                session === "sultan" ? (
                  <div className="relative">
                    <div className="fixed right-4 top-4 z-50">
                      <Button variant="outline" size="sm" onClick={handleLogout}>
                        Выйти
                      </Button>
                    </div>
                    <Index />
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/steppe/*"
              element={session === "ruslan" ? <SteppeHotelCRM onLogout={handleLogout} /> : <Navigate to="/" replace />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={session ? <NotFound /> : <Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
