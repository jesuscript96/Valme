import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getMyAccess, logSessionEvent } from "@/lib/access.functions";
import { AuthShell, Notice, inputCls, primaryBtn, secondaryBtn } from "@/components/valme-auth-shell";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Iniciar sesión · VALME Search OS" },
      { name: "description", content: "Acceso para usuarios autorizados de VALME Search OS." },
      { property: "og:title", content: "Iniciar sesión · VALME Search OS" },
      { property: "og:description", content: "Acceso solo para usuarios invitados por VALME." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const DENIED = "Tu cuenta no tiene acceso a VALME Search OS. Solicita acceso al administrador.";
const OAUTH_FLAG = "valme-oauth-pending";

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const checkAccess = useServerFn(getMyAccess);
  const log = useServerFn(logSessionEvent);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const authorize = useCallback(
    async (method: "password" | "google") => {
      const access = await checkAccess();
      if (!access.allowed) {
        await log({ data: { action: method === "google" ? "login_google_denied" : "login_password_denied" } }).catch(() => undefined);
        await supabase.auth.signOut();
        qc.clear();
        setError(access.reason === "desactivado" ? "Tu acceso a VALME Search OS está desactivado. Solicita acceso al administrador." : DENIED);
        return;
      }
      await log({ data: { action: method === "google" ? "login_google_success" : "login_password_success" } }).catch(() => undefined);
      qc.setQueryData(["my-access"], access);
      navigate({ to: "/panel", replace: true });
    },
    [checkAccess, log, navigate, qc],
  );

  // Retorno de Google o sesión ya abierta
  useEffect(() => {
    const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
    const oauthError = params.get("error_description") || params.get("error");
    if (oauthError) {
      sessionStorage.removeItem(OAUTH_FLAG);
      setError(/signup|sign up|not allowed/i.test(oauthError) ? DENIED : "No se pudo completar el inicio de sesión con Google.");
      return;
    }
    if (params.get("denied")) setError(DENIED);
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const pending = sessionStorage.getItem(OAUTH_FLAG);
      sessionStorage.removeItem(OAUTH_FLAG);
      setBusy(true);
      authorize(pending ? "google" : "password").finally(() => setBusy(false));
    });
  }, [authorize]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      setError(/invalid/i.test(err.message) ? "Email o contraseña incorrectos." : /confirm/i.test(err.message) ? "Tu email aún no está confirmado. Revisa la invitación recibida." : "No se pudo iniciar sesión. Inténtalo de nuevo.");
      return;
    }
    await authorize("password").finally(() => setBusy(false));
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    sessionStorage.setItem(OAUTH_FLAG, "1");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) {
      sessionStorage.removeItem(OAUTH_FLAG);
      setBusy(false);
      setError(/signup|not allowed/i.test(String(result.error)) ? DENIED : "No se pudo iniciar sesión con Google.");
      return;
    }
    if (result.redirected) return;
    sessionStorage.removeItem(OAUTH_FLAG);
    await authorize("google").finally(() => setBusy(false));
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      // Sin revelar si la cuenta existe: solo se informa de límites de envío o fallos de red.
      if (err && (err.status === 429 || /rate limit|too many/i.test(err.message))) {
        setError("Se han enviado demasiados correos en poco tiempo. Espera unos minutos y vuelve a intentarlo.");
        return;
      }
      if (err && !err.status) {
        setError("No se pudo contactar con el servicio de acceso. Revisa la conexión y vuelve a intentarlo.");
        return;
      }
      setInfo("Si el email corresponde a una cuenta autorizada, recibirás un enlace para fijar una nueva contraseña.");
    } catch {
      setError("No se pudo contactar con el servicio de acceso. Revisa la conexión y vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "forgot") {
    return (
      <AuthShell title="Recuperar contraseña">
        <form onSubmit={onForgot} className="space-y-4">
          <label className="block text-sm">Email<input type="email" required autoComplete="email" className={`${inputCls} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className={primaryBtn} disabled={busy}>Enviar enlace</button>
          <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => { setMode("login"); setInfo(null); }}>Volver a iniciar sesión</button>
        </form>
        {info && <Notice kind="info">{info}</Notice>}
        {error && <Notice kind="error">{error}</Notice>}
      </AuthShell>
    );
  }

  return (
    <AuthShell title="VALME Search OS">
      <form onSubmit={onLogin} className="space-y-4">
        <label className="block text-sm">Email<input type="email" required autoComplete="email" className={`${inputCls} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm">Contraseña<input type="password" required autoComplete="current-password" className={`${inputCls} mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className={primaryBtn} disabled={busy}>{busy ? "Comprobando…" : "Iniciar sesión"}</button>
      </form>
      <div className="my-4 flex items-center gap-3 font-mono text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" /></div>
      <button type="button" className={secondaryBtn} onClick={onGoogle} disabled={busy}>Continuar con Google</button>
      <button type="button" className="mt-4 w-full text-sm text-muted-foreground underline" onClick={() => { setMode("forgot"); setError(null); }}>¿Has olvidado tu contraseña?</button>
      {error && <Notice kind="error">{error}</Notice>}
    </AuthShell>
  );
}
