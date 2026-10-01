import Link from "next/link";
import * as seed from "@/os/repo/seed.data";
import { seoModulo } from "@/os/seo";
import { Generador } from "@/os/seo/ui/Generador";
import { EmptyState, PageHeader, cx } from "@/os/ui/primitives";

export const metadata = { title: "Generadores GEO · SEO · Valme OS" };

/**
 * Generadores de llms.txt y JSON-LD por proyecto. Se prellenan con lo que Valme ya sabe
 * del cliente (onboarding y Brand Kit); lo que no se sabe se deja vacío, no se inventa.
 */
export default async function Generadores({ searchParams }: { searchParams: Promise<{ proyecto?: string }> }) {
  const { proyecto: pid } = await searchParams;
  const seo = await seoModulo();
  // Un enlace directo a un proyecto lo abre aunque el filtro de cliente sea otro (si hay acceso).
  const p =
    seo.datos.proyectos.find((x) => x.id === pid && seo.clientes.some((c) => c.id === x.clientId)) ?? seo.proyectos[0];
  if (!p) return <EmptyState title="No hay proyectos" body="Crea el proyecto (dominio) del cliente en Proyectos." />;

  const cliente = seo.cliente(p.clientId);
  const alta = seo.datos.altas.find((a) => a.clientId === p.clientId);
  const kit = seed.brandKits.find((k) => k.clientId === p.clientId);
  const servicios = kit?.business.services.map((s) => s.value) ?? [];

  return (
    <>
      <nav className="mb-3 text-[13px] text-os-muted"><Link href="/app/seo/herramientas" className="hover:text-os-text">Herramientas</Link> <span className="mx-1.5 text-os-faint">/</span> Generadores GEO</nav>
      <PageHeader
        title="Generadores GEO: llms.txt y datos estructurados"
        description="Las dos correcciones que más piden los hallazgos de visibilidad en asistentes: decirles qué hace la empresa y qué páginas citar, y declarar quién es."
      />
      <div className="mb-4 flex flex-wrap gap-1.5 text-[12px]">
        {seo.proyectos.map((x) => (
          <Link key={x.id} href={`/app/seo/herramientas/generadores?proyecto=${x.id}`}
            className={cx("rounded-md border px-2 py-1", x.id === p.id ? "border-os-text bg-os-text text-white" : "border-os-border bg-os-surface text-os-muted hover:text-os-text")}>
            {seo.cliente(x.clientId)?.name} · {x.dominio}
          </Link>
        ))}
      </div>
      <Generador
        key={p.id}
        proyectoId={p.id}
        inicial={{
          nombre: alta?.datos.nombre || cliente?.name || "",
          url: `https://${p.dominio}`,
          descripcion: kit?.business.valueProposition?.value ?? "",
          servicios: (servicios.length ? servicios : (alta?.datos.prioritarios ?? "").split(/[,;]/)).map((s) => s.trim()).filter(Boolean).join(", "),
          zona: alta?.datos.mercados ?? "",
          telefono: "",
          email: "",
          logo: "",
          perfiles: "",
          paginas: "",
        }}
      />
    </>
  );
}
