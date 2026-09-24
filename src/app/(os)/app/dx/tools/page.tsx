import Link from "next/link";
import { CLAVES, HERRAMIENTAS } from "@/os/audit/tools";
import { FUNCIONES } from "@/os/audit/types";
import { Badge, Card, PageHeader } from "@/os/ui/primitives";

export const metadata = { title: "Herramientas · Valme OS" };

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="Herramientas"
        description="Tres informes sobre un dominio, sin pedir accesos. Funcionan sueltas o sobre un lead: si las lanzas desde un lead, la auditoría queda enganchada a él."
      />

      <div className="grid gap-3">
        {CLAVES.map((c) => {
          const h = HERRAMIENTAS[c];
          return (
            <Link key={c} href={`/app/dx/tools/${c}`}>
              <Card className="flex items-start justify-between gap-6 p-5 transition-colors hover:border-os-border-strong">
                <div className="min-w-0">
                  <h2 className="font-display text-[16px] font-semibold text-os-text">{h.nombre}</h2>
                  <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-os-muted">
                    {h.descripcion}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {h.funciones.map((f) => (
                      <Badge key={f} tone="info">{FUNCIONES[f].nombre}</Badge>
                    ))}
                    <Badge>lo lleva @{h.dueño}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-6 p-4">
        <p className="text-[13px] font-medium text-os-text">Por qué la recolección es compartida</p>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-os-muted">
          Cargar la página con un navegador tarda unos veinte segundos y alimenta a las tres a
          la vez: el píxel es de Paid, el canonical es de SEO y el formulario es de Web, y
          salen todos de la misma carga. Por eso pedir las tres cuesta poco más que pedir una,
          y cada herramienta solo añade encima sus colectores caros.
        </p>
      </Card>
    </>
  );
}
