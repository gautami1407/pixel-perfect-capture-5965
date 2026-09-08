import { Button } from "@/components/ui/button";
import { ApiError, setToken } from "@/services/api/client";
import { lpsApi } from "@/services/api/lps";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in | LPS Compliance Intelligence" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const result = await lpsApi.login(email, password);
            setToken(result.access_token);
            navigate({ to: "/dashboard" });
          } catch (err) {
            setError(err instanceof ApiError ? err.detail : "Sign in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          <div>
            <p className="brand-name">LPS</p>
            <p className="brand-subtitle">Compliance Intelligence</p>
          </div>
        </div>
        <p className="section-kicker">AUTHORIZED ACCESS</p>
        <h1>Sign in</h1>
        <p className="page-description">Use an issued inspector, supervisor, or administrator account.</p>
        {error && <p className="login-error">{error}</p>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
        </div>
        <Button className="primary-action full-width" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
