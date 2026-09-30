import { seoModulo } from "@/os/seo";
import { abierta } from "@/os/seo";
import { FiltroCliente } from "@/os/seo/ui/FiltroCliente";
import { Shell } from "@/os/ui/Shell";

/**
 * Layout del módulo SEO · GEO · AEO.
 *
 * Todo lo de buscadores y asistentes vive aquí: auditorías, hallazgos, el plan con sus
 * tareas y la visibilidad en IA. Trabaja sobre todos los clientes visibles, con un filtro
 * de cliente arriba. NO autoriza: cada página y cada acción pasa por el DAL.
 */
export default async function SeoLayout({ children }: { children: React.ReactNode }) {
  const seo = await seoModulo();
  const porDecidir = seo.hallazgos.filter((h) => h.decision.valor === "pendiente").length;
  const abiertas = seo.tareas.filter(abierta).length;

  return (
    <Shell
      contexto="seo"
      user={{ name: seo.member.name, email: seo.member.email, role: seo.member.role }}
      clients={[]}
      current={null}
      lateral={
        <FiltroCliente
          clientes={seo.clientes.map((c) => ({ slug: c.slug, name: c.name }))}
          actual={seo.filtro?.slug ?? null}
        />
      }
      nav={[
        { href: "/app/seo", label: "Panel", icon: "panel" },
        {
          href: "/app/seo/auditorias", label: "Auditorías", icon: "audit",
          badge: porDecidir ? String(porDecidir) : undefined,
        },
        {
          href: "/app/seo/plan", label: "Plan y tareas", icon: "plan",
          badge: abiertas ? String(abiertas) : undefined,
        },
        { href: "/app/seo/geo", label: "Visibilidad IA (GEO)", icon: "geo" },
        { href: "/app/seo/herramientas", label: "Herramientas", icon: "tools" },
        { href: "/app/seo/proyectos", label: "Proyectos", icon: "projects" },
      ]}
    >
      {children}
    </Shell>
  );
}
