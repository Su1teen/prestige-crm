import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SessionUser = "sultan" | "ruslan";

interface LoginPageProps {
  onLogin: (user: SessionUser) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login === "sultan" && password === "admin") {
      onLogin("sultan");
      navigate("/luxe", { replace: true });
      return;
    }

    if (login === "ruslan" && password === "admin123") {
      onLogin("ruslan");
      navigate("/steppe", { replace: true });
      return;
    }

    setError("Неверный логин или пароль");
    setShakeKey((value) => value + 1);
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <motion.form
          key={shakeKey}
          animate={error ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated"
        >
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Steppe HM</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Вход в CRM</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Единая точка доступа для LuxeCRM и Steppe Hotel CRM.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                value={login}
                onChange={(event) => setLogin(event.target.value.trim())}
                className="bg-background/60"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-background/60"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-7 w-full">
            Войти
          </Button>

          <div className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <p>Sultan Sovetov: существующий LuxeCRM</p>
            <p>Ruslan Tszi: Steppe Hotel CRM, директор по маркетингу</p>
          </div>
        </motion.form>
      </main>
    </div>
  );
};

export default LoginPage;
