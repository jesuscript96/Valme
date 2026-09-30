import Link from "next/link";
import { HERRAMIENTAS, ESTADO_LABEL } from "@/os/audit/tools";
import { requireMember } from "@/os/auth/dal";
import { Badge, Card, PageHeader } from "@/os/ui/primitives";

export const metadata = { title: "Herramientas · SEO · Valme OS" };

/** Las herramientas del módulo, para lanzarlas sobre cualquier dominio sin crear auditoría. */
const DEL_MODULO = ["seo", "geo"] as const;

export default async function Herramientas() {
  await requireMember();
  return (
    <>
      <PageHeader
        title="Herramientas"
        description="Informes rápidos sobre cualquier dominio, sin crear un encargo. Para dejar constancia y decidir sobre los hallazgos, crea una auditoría."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {DEL_MODULO.map((c) => {
          const h = HERRAMIENTAS[c];
          return (
            <Link key={c} href={`/app/seo/herramientas/${c}`}>
              <Card className="h-full space-y-2 p-4 hover:border-os-border-strong">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-os-text">{h.nombre}</h2>
                  <Badge tone={h.estado === "listo" ? "ok" : "warn"}>{ESTADO_LABEL[h.estado]}</Badge>
                </div>
                <p className="text-[13px] leading-relaxed text-os-muted">{h.descripcion}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
