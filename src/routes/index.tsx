import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "VALME Search OS" },
      { name: "description", content: "Centro de mando interno de VALME para una agencia SEO, AEO y GEO supervisada. Acceso solo por invitación." },
      { property: "og:title", content: "VALME Search OS" },
      { property: "og:description", content: "Los agentes ejecutan. El Project Manager dirige. Acceso solo por invitación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/panel" : "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          VALME Search OS — Centro de mando para agencias SEO, AEO y GEO
        </h1>
        <p className="text-muted-foreground">
          Plataforma interna de VALME donde los agentes ejecutan auditorías, diagnósticos y planes
          de posicionamiento en buscadores y motores de respuesta, y el Project Manager revisa y
          aprueba cada paso. Acceso solo por invitación.
        </p>
        <p className="font-mono text-sm text-muted-foreground">Comprobando sesión…</p>
      </div>
    </main>
  );
}
