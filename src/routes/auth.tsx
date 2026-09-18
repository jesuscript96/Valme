import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso · VALME Search OS" },
      {
        name: "description",
        content: "Acceso del Project Manager al centro de mando de VALME Search OS.",
      },
      { property: "og:title", content: "Acceso · VALME Search OS" },
      {
        property: "og:description",
        content: "Acceso del Project Manager al centro de mando de VALME Search OS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/centro-de-mando", replace: true });
    });
  }, [navigate]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      if (modo === "crear") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/centro-de-mando` },
        });
        if (signUpError) throw signUpError;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/centro-de-mando", replace: true });
          return;
        }
        setMensaje("Cuenta creada. Revisa tu correo para confirmarla y vuelve a entrar.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate({ to: "/centro-de-mando", replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido completar el acceso.");
    } finally {
      setCargando(false);
    }
  }

  async function entrarConGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("No se ha podido continuar con Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/centro-de-mando", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ← VALME Search OS
        </Link>
        <div className="mt-6 rounded-xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            {modo === "entrar" ? "Acceso del Project Manager" : "Crear acceso"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El panel contiene datos de demostración. Ninguna acción se ejecuta sobre clientes reales.
          </p>

          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {mensaje ? <p className="text-sm text-muted-foreground">{mensaje}</p> : null}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              {cargando ? "Procesando…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <button
            type="button"
            onClick={entrarConGoogle}
            className="mt-3 w-full rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            Continuar con Google
          </button>

          <button
            type="button"
            onClick={() => setModo(modo === "entrar" ? "crear" : "entrar")}
            className="mt-6 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {modo === "entrar" ? "No tengo acceso todavía" : "Ya tengo acceso"}
          </button>
        </div>
      </div>
    </div>
  );
}
