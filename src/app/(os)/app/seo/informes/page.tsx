import Link from "next/link";
import { seoModulo } from "@/os/seo";
import { crearInformeAccion } from "@/os/seo/operacion/acciones";
import { estadoInforme, rutaInforme } from "@/os/seo/operacion/informes";
import { Estado, fmtDia } from "@/os/seo/ui/etiquetas";
import { Desplegable, Formulario } from "@/os/seo/ui/Formulario";
import { Card, EmptyState, Field, Input, PageHeader, Select } from "@/os/ui/primitives";

export const metadata = { title: "Informes · SEO · Valme OS" };

/** Entregables verificables: del resultado a la evidencia, con dos llaves para entregar. */
export default async function Informes() {
  const seo = await seoModulo();
  const nombre = (id: string) => seo.cliente(id)?.name ?? "Cliente";
  const estados = seo.informes.map((i) => estadoInforme(seo.datos, i));
  const cuenta = (e: string) => estados.filter((x) => x === e).length;

  return (
    <>
      <PageHeader
        title="Informes"
        description="Del resultado a la evidencia. El contenido se construye desde la auditoría, el diagnóstico o las mediciones GEO, y entregarlo exige aprobar el contenido y autorizar el envío."
        action={
          <Desplegable titulo="+ Preparar informe">
            <Formulario accion={crearInformeAccion} boton="Preparar" pendiente="Preparando…" className="w-96">
              <Field label="A partir de">
                <Select name="origen" required>
                  <optgroup label="Auditorías">
                    {seo.auditorias.filter((a) => !a.archivadaEn).map((a) => <option key={a.id} value={`auditoria:${a.id}`}>{nombre(a.clientId)} · {a.ref}</option>)}
                  </optgroup>
                  <optgroup label="Diagnósticos">
                    {seo.encargos.map((e) => <option key={e.id} value={`diagnostico:${e.id}`}>{nombre(e.clientId)} · {e.id}</option>)}
                  </optgroup>
                  <optgroup label="Visibilidad en IA">
                    {seo.proyectos.map((p) => <option key={p.id} value={`geo:${p.id}`}>{nombre(p.clientId)} · {p.dominio}</option>)}
                  </optgroup>
                </Select>
              </Field>
              <Field label="Fecha de entrega prevista"><Input name="fecha" type="date" /></Field>
            </Formulario>
          </Desplegable>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Envío autorizado", cuenta("Envío autorizado")], ["Contenido aprobado", cuenta("Contenido aprobado")], ["En revisión", cuenta("En revisión")], ["Datos insuficientes", cuenta("Datos insuficientes")]].map(([k, v]) => (
          <Card key={k as string} className="px-4 py-3">
            <p className="text-[11px] uppercase text-os-faint">{k}</p>
            <p className="os-num mt-1 font-display text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
      {seo.informes.length ? (
        <ul className="divide-y divide-os-border rounded-lg border border-os-border bg-os-surface">
          {[...seo.informes].reverse().map((i, k) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[12px]"><Estado t={estados[seo.informes.length - 1 - k]!} /> <span className="os-num ml-1 text-os-faint">{i.id}</span></p>
                <p className="text-[13px] font-medium">{i.titulo}</p>
                <p className="text-xs text-os-muted">{nombre(i.clientId)} · {i.fechaEntrega ? `entrega ${fmtDia(i.fechaEntrega)}` : "sin fecha"}</p>
              </div>
              <Link href={rutaInforme(i.id)} className="text-[13px] font-medium hover:underline">Revisar informe →</Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Todavía no hay informes" body="Prepara uno a partir de una auditoría validada, un diagnóstico completado o las mediciones GEO de un proyecto." />
      )}
    </>
  );
}
