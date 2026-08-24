import { useState } from "react";
import { Building2, Handshake, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATERHAUS_ADMIN_EMAIL, useAuth, type UserRole } from "@/contexts/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate(role === "PATERHAUS" || role === "ADMIN" ? "/paterhaus" : "/steppe", { replace: true });
  };

  const handlePaterhausLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const role = loginWithEmail(email, password);
    if (!role) {
      setError(`Use ${PATERHAUS_ADMIN_EMAIL} with any password for the Paterhaus demo.`);
      return;
    }
    setError(null);
    navigate("/paterhaus", { replace: true });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl rounded-2xl border border-border bg-card/80 p-8 shadow-elevated backdrop-blur-md md:p-12"
        >
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Steppe Hotel CRM</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Выберите рабочее пространство</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Два режима используют единую базу PMS и показывают разные бизнес-процессы.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleLogin("HM")}
              className="h-36 whitespace-normal rounded-2xl border-primary/30 bg-background/60 px-6 text-base transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:bg-primary/10"
            >
              <span className="flex flex-col items-center gap-3 text-center">
                <Building2 className="h-8 w-8 text-primary" />
                <span>Войти как Администратор (Cosmonaut HM)</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleLogin("B2B")}
              className="h-36 whitespace-normal rounded-2xl border-emerald-500/30 bg-background/60 px-6 text-base transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              <span className="flex flex-col items-center gap-3 text-center">
                <Handshake className="h-8 w-8 text-emerald-400" />
                <span>Войти как Менеджер B2B (Корпоративные продажи)</span>
              </span>
            </Button>
          </div>

          <form
            onSubmit={handlePaterhausLogin}
            className="mt-6 rounded-2xl border border-amber-500/30 bg-background/60 p-6"
          >
            <div className="flex items-center gap-3">
              <Home className="h-6 w-6 flex-shrink-0 text-amber-300" />
              <div>
                <p className="font-medium text-foreground">Paterhaus Property Management</p>
                <p className="text-xs text-muted-foreground">Admin sign-in · Dubai property management demo</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                type="email"
                autoComplete="email"
                placeholder="admin@paterhaus.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label="Paterhaus email"
              />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label="Paterhaus password"
              />
            </div>
            {error && <p className="mt-2 text-xs text-amber-300">{error}</p>}
            <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={!email.trim() || !password.trim()}>
              Sign in to Paterhaus
            </Button>
          </form>
        </motion.section>
      </main>
    </div>
  );
};

export default LoginPage;
