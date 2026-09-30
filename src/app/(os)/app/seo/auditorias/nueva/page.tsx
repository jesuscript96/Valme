import Link from "next/link";
import { seoModulo } from "@/os/seo";
import { crearAuditoriaAccion } from "@/os/seo/acciones";
import { SERVICIOS } from "@/os/seo/tipos";
import { Formulario } from "@/os/seo/ui/Formulario";
import { Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "@/os/ui/primitives";

export const metadata = { title: "Nueva auditoría · SEO · Valme OS" };

export default async function NuevaAuditoria({
  searchParams,
}: { searchParams: Promise<{ proyecto?: string }> }) {
  const { proyecto } = await searchParams;
  const seo = await seoModulo();
  const porCliente = seo.clientes
    .map((c) => ({ c, proyectos: seo.proyectos.filter((p) => p.clientId === c.id) }))
    .filter((x) => x.proyectos.length);

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted">
        <Link href="/app/seo/auditorias" className="hover:text-os-text">Auditorías</Link>
        <span className="mx-1.5 text-os-faint">/</span>
        Nueva
      </nav>
      <PageHeader
        title="Nueva auditoría"
        description="Se guarda como borrador. No se ejecuta nada hasta que un PM autorice el alcance con una referencia."
      />

      {porCliente.length ? (
        <Card className="max-w-3xl p-5">
          <Formulario accion={crearAuditoriaAccion} boton="Guardar borrador" pendiente="Creando…">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-os-faint">01 · Contexto</p>
            <Field label="Cliente y proyecto" htmlFor="au-proyecto">
              <Select id="au-proyecto" name="proyectoId" defaultValue={proyecto ?? porCliente[0]?.proyectos[0]?.id} required>
                {porCliente.map(({ c, proyectos }) => (
                  <optgroup key={c.id} label={c.name}>
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>{c.name} · {p.nombre} · {p.dominio}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-os-faint">02 · Alcance</p>
            <fieldset className="space-y-1.5">
              <legend className="text-[13px] font-medium text-os-text">Servicios autorizables</legend>
              <div className="flex flex-wrap gap-4 text-[13px]">
                {SERVICIOS.map((s, i) => (
                  <label key={s} className="inline-flex items-center gap-2">
                    <input type="checkbox" name="servicios" value={s} defaultChecked={i === 0} />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Límites y exclusiones" htmlFor="au-alcance">
              <Textarea
                id="au-alcance"
                name="alcance"
                required
                defaultValue="Dominio principal y recursos públicos aportados. Solo lectura; sin publicación ni cambios externos."
              />
            </Field>

            <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-os-faint">03 · Consumo máximo</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Páginas" htmlFor="au-paginas">
                <Input id="au-paginas" name="paginas" type="number" min={1} max={10000} defaultValue={500} required />
              </Field>
              <Field label="Duración (min)" htmlFor="au-minutos">
                <Input id="au-minutos" name="minutos" type="number" min={1} max={1440} defaultValue={45} required />
              </Field>
              <Field label="Coste máximo (EUR)" htmlFor="au-coste">
                <Input id="au-coste" name="coste" type="number" min={0} step="0.01" defaultValue={0} required />
              </Field>
            </div>
          </Formulario>
        </Card>
      ) : (
        <EmptyState
          title="No hay proyectos"
          body="Una auditoría se hace sobre el dominio de un proyecto. Crea antes el proyecto del cliente."
          action={<Link href="/app/seo/proyectos" className="text-[13px] font-medium underline">Ir a Proyectos</Link>}
        />
      )}
    </>
  );
}
