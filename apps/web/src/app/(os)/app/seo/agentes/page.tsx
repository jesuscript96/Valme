import Link from "next/link";
import { seoModulo } from "@valme/os/seo";
import { CAPACIDAD_AGENTE, cargaAgentes } from "@valme/os/seo/operacion/panel";
import { Badge, Card, PageHeader } from "@valme/os/ui/primitives";

export const metadata = { title: "Agentes · SEO · Valme OS" };

/** Las ocho especialidades: carga calculada con el trabajo abierto real, no fijada a mano. */
export default async function Agentes() {
  const seo = await seoModulo();
  const carga = cargaAgentes(seo.datos, seo.ambito);
  const libres = carga.filter((c) => c.carga < 80).length;

  return (
    <>
      <PageHeader
        title="Agentes"
        description="8 especialidades. Los agentes preparan y comprueban dentro del alcance; publicar, enviar o cambiar permisos siempre lo decide una persona."
      />
      <Card className="mb-6 px-4 py-3 text-[13px]">
        <span className="font-medium">{libres} de 8 especialidades con margen.</span>{" "}
        <span className="text-os-muted">
          La carga es el trabajo abierto (tareas, acciones de planes aprobados y diagnósticos en curso) sobre una capacidad de{" "}
          {CAPACIDAD_AGENTE} elementos por especialidad.
        </span>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {carga.map((c) => (
          <Card key={c.especialidad} className="space-y-2 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-os-faint">Especialidad 0{c.n}</p>
            <p className="text-[13px] font-semibold">{c.especialidad}</p>
            <p className="text-xs text-os-muted">{c.clientes.length} cliente(s) asignado(s)</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-os-sunken" role="meter" aria-valuenow={c.carga} aria-valuemin={0} aria-valuemax={100}>
              <div className={c.carga > 80 ? "h-full bg-os-accent" : "h-full bg-os-text"} style={{ width: `${c.carga}%` }} />
            </div>
            <p className="flex items-center justify-between text-xs">
              <Badge tone={c.carga > 80 ? "warn" : "neutral"}>Carga {c.carga}%</Badge>
              <span className="text-os-muted">{100 - c.carga}% disponible</span>
            </p>
            <p className="text-xs text-os-muted">Hechas 7 días: {c.hechas7d} · Incidencias 7 días: {c.incidencias7d}</p>
            <Link href={`/app/seo/agentes/${c.n}`} className="inline-block text-[13px] font-medium hover:underline">Carga, trabajo y permisos →</Link>
          </Card>
        ))}
      </div>
    </>
  );
}
