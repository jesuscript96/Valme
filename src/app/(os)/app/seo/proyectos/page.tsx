import Link from "next/link";
import { seoModulo } from "@/os/seo";
import { crearProyectoAccion } from "@/os/seo/acciones";
import { Desplegable, Formulario } from "@/os/seo/ui/Formulario";
import { fmtDia } from "@/os/seo/ui/etiquetas";
import { Card, EmptyState, Field, Input, PageHeader, Select, Table, Td, Th } from "@/os/ui/primitives";

export const metadata = { title: "Proyectos · SEO · Valme OS" };

/** Un proyecto es un dominio de un cliente: sobre él se hacen auditorías y mediciones GEO. */
export default async function Proyectos() {
  const seo = await seoModulo();

  return (
    <>
      <PageHeader
        title="Proyectos"
        description="Los dominios de cada cliente sobre los que se audita y se mide la visibilidad en IA."
        action={
          seo.actor.pm ? (
            <Desplegable titulo="+ Nuevo proyecto">
              <Formulario accion={crearProyectoAccion} boton="Crear proyecto" className="w-80">
                <Field label="Cliente">
                  <Select name="clientId" defaultValue={seo.filtro?.id ?? seo.clientes[0]?.id}>
                    {seo.clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nombre">
                  <Input name="nombre" placeholder="Web principal" required />
                </Field>
                <Field label="Dominio">
                  <Input name="dominio" placeholder="www.ejemplo.com" required />
                </Field>
              </Formulario>
            </Desplegable>
          ) : undefined
        }
      />

      {seo.proyectos.length ? (
        <Table>
          <thead>
            <tr><Th>Cliente</Th><Th>Proyecto</Th><Th>Dominio</Th><Th className="text-right">Auditorías</Th><Th>Última medición GEO</Th><Th /></tr>
          </thead>
          <tbody>
            {seo.proyectos.map((p) => {
              const auditorias = seo.auditorias.filter((a) => a.proyectoId === p.id).length;
              const geo = seo.mediciones.filter((m) => m.proyectoId === p.id).sort((a, b) => b.en.localeCompare(a.en))[0];
              return (
                <tr key={p.id}>
                  <Td className="font-medium">{seo.cliente(p.clientId)?.name}</Td>
                  <Td>{p.nombre}</Td>
                  <Td className="text-os-muted">{p.dominio}</Td>
                  <Td className="os-num text-right">{auditorias}</Td>
                  <Td className="text-os-muted">
                    {geo ? `${fmtDia(geo.en)} · ${geo.estado === "medida" ? `${geo.menciones}/${geo.consultas.length}` : "no disponible"}` : "—"}
                  </Td>
                  <Td className="text-right">
                    <Link href={`/app/seo/auditorias/nueva?proyecto=${p.id}`} className="text-[13px] text-os-muted hover:text-os-text">
                      Nueva auditoría →
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <Card>
          <EmptyState title="Todavía no hay proyectos" body="Crea el primero con el botón de arriba." />
        </Card>
      )}
    </>
  );
}
