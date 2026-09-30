import Link from "next/link";
import { seoDe } from "@/os/seo";
import { crearAuditoriaAccion } from "@/os/seo/acciones";
import { SERVICIOS } from "@/os/seo/tipos";
import { Formulario } from "@/os/seo/ui/Formulario";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/os/ui/primitives";

export const metadata = { title: "Nueva auditoría · Valme OS" };

export default async function NuevaAuditoria({
  params, searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ proyecto?: string }>;
}) {
  const { client: slug } = await params;
  const { proyecto } = await searchParams;
  const { proyectos } = await seoDe(slug);

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted">
        <Link href={`/app/c/${slug}/seo`} className="hover:text-os-text">SEO · GEO · AEO</Link>
        <span className="mx-1.5 text-os-faint">/</span>
        Nueva auditoría
      </nav>
      <PageHeader
        title="Nueva auditoría"
        description="Se guarda como borrador. No se ejecuta nada hasta que un PM autorice el alcance con una referencia."
      />

      <Card className="max-w-3xl p-5">
        <Formulario accion={crearAuditoriaAccion.bind(null, slug)} boton="Guardar borrador" pendiente="Creando…">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-os-faint">01 · Contexto</p>
          <Field label="Proyecto" htmlFor="au-proyecto">
            <Select id="au-proyecto" name="proyectoId" defaultValue={proyecto ?? proyectos[0]?.id} required>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.dominio}
                </option>
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
    </>
  );
}
