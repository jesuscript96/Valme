import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VALME Search OS · Sistema operativo de agencia SEO, AEO y GEO" },
      {
        name: "description",
        content:
          "Centro de mando para supervisar una agencia SEO, AEO y GEO operada por agentes: aprobaciones, cartera, carga de agentes y resultados.",
      },
      { property: "og:title", content: "VALME Search OS" },
      {
        property: "og:description",
        content:
          "Los agentes ejecutan, el Project Manager dirige. Aprobaciones, cartera, carga de agentes y resultados en una sola pantalla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">VALME Search OS</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Los agentes ejecutan. El Project Manager dirige.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Sistema operativo de una agencia SEO, AEO y GEO semiautomatizada. La IA propone y prepara; las
          decisiones, las aprobaciones y los envíos siguen siendo humanos.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/centro-de-mando"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99]"
          >
            Entrar al centro de mando
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Acceso
          </Link>
        </div>

        <dl className="mt-16 grid gap-6 border-t border-border pt-10 sm:grid-cols-3">
          {[
            ["Cartera supervisada", "84 clientes con 8 especialidades cada uno"],
            ["Decisión humana", "Aprobar el contenido y autorizar el envío son decisiones separadas"],
            ["Trazabilidad", "Cliente, agente, evidencia, impacto y fecha en cada acción"],
          ].map(([titulo, detalle]) => (
            <div key={titulo}>
              <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{titulo}</dt>
              <dd className="mt-2 text-sm text-foreground">{detalle}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-16 max-w-2xl text-xs text-muted-foreground">
          Esta versión utiliza datos ficticios identificados como demostración. No existen conexiones con
          herramientas externas ni ejecución real sobre clientes.
        </p>
      </div>
    </main>
  );
}
