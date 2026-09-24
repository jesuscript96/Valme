import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Notice, inputCls, primaryBtn } from "@/components/valme-auth-shell";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Nueva contraseña · VALME Search OS" },
      { name: "description", content: "Fija tu contraseña de acceso a VALME Search OS." },
      { property: "og:title", content: "Nueva contraseña · VALME Search OS" },
      { property: "og:description", content: "Fija tu contraseña de acceso a VALME Search OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setReady(true); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 10) return setError("La contraseña debe tener al menos 10 caracteres.");
    if (pw !== pw2) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) return setError(/pwned|leaked|weak/i.test(err.message) ? "Esa contraseña aparece en filtraciones conocidas. Elige otra." : "No se pudo guardar la contraseña. Solicita un enlace nuevo.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AuthShell title="Fijar contraseña">
      {!ready ? (
        <Notice kind="info">Abre esta página desde el enlace de invitación o recuperación que has recibido por email. Si ha caducado, solicita uno nuevo.</Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">Nueva contraseña<input type="password" autoComplete="new-password" className={`${inputCls} mt-1`} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label className="block text-sm">Repite la contraseña<input type="password" autoComplete="new-password" className={`${inputCls} mt-1`} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          <button className={primaryBtn} disabled={busy}>Guardar y continuar</button>
        </form>
      )}
      {error && <Notice kind="error">{error}</Notice>}
    </AuthShell>
  );
}
