import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth, workspacePath, type WorkspaceId } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const user = login(email, password);
    setSubmitting(false);
    if (!user) {
      setError(t("login.error"));
      return;
    }
    navigate(workspacePath(user.workspace as WorkspaceId), { replace: true });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Smart CRM</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("login.title")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/80 p-6 shadow-elevated backdrop-blur-md sm:p-8"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  {t("login.email")}
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  {t("login.password")}
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-6 w-full" disabled={submitting || !email.trim() || !password.trim()}>
              {submitting ? t("login.signingIn") : t("login.button")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
