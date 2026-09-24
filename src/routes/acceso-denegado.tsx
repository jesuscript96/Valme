import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/valme-auth-shell";

export const Route = createFileRoute("/acceso-denegado")({
  head: () => ({
    meta: [
      { title: "Acceso denegado · VALME Search OS" },
      { name: "description", content: "No tienes permiso para ver este recurso de VALME Search OS." },
      { property: "og:title", content: "Acceso denegado · VALME Search OS" },
      { property: "og:description", content: "No tienes permiso para ver este recurso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Denied,
});

export function DeniedBody() {
  return (
    <>
      <p className="text-sm text-muted-foreground">No tienes permiso para ver este recurso. Si crees que es un error, solicita acceso al administrador.</p>
      <Link to="/panel" className="mt-6 inline-block text-sm underline">Volver al panel</Link>
    </>
  );
}

function Denied() {
  return <AuthShell title="Acceso denegado"><DeniedBody /></AuthShell>;
}
