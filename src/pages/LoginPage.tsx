import { Building2, Handshake, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { CURRENT_PATERHAUS_USER } from "@/data/paterhaus";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate(role === "PATERHAUS" ? "/paterhaus" : "/steppe", { replace: true });
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

          <div className="grid gap-4 md:grid-cols-3">
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
              onClick={() => handleLogin("PATERHAUS")}
              className="h-36 whitespace-normal rounded-2xl border-amber-500/30 bg-background/60 px-6 text-base transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-amber-400 hover:bg-amber-500/10"
            >
              <span className="flex flex-col items-center gap-3 text-center">
                <Home className="h-8 w-8 text-amber-300" />
                <span>{CURRENT_PATERHAUS_USER.name} · {CURRENT_PATERHAUS_USER.role} · Paterhaus Property Management</span>
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
        </motion.section>
      </main>
    </div>
  );
};

export default LoginPage;
