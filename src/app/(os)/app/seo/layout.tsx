import { abierta, seoModulo } from "@/os/seo";
import { colaSupervision } from "@/os/seo/operacion/panel";
import { FiltroCliente } from "@/os/seo/ui/FiltroCliente";
import { Shell } from "@/os/ui/Shell";

/**
 * Layout del módulo SEO · GEO · AEO.
 *
 * Todo lo del servicio de buscadores y asistentes vive aquí, como en VALME Search OS:
 * centro de mando, alta de clientes, cartera, auditorías, plan, agentes, supervisión,
 * operaciones, informes y visibilidad en IA. Trabaja sobre todos los clientes visibles,
 * con un filtro de cliente arriba. NO autoriza: cada página y cada acción pasa por el DAL.
 */
export default async function SeoLayout({ children }: { children: React.ReactNode }) {
  const seo = await seoModulo();
  const porDecidir = seo.hallazgos.filter((h) => h.decision.valor === "pendiente").length;
  const abiertas = seo.tareas.filter(abierta).length;
  const cola = colaSupervision(seo.datos, seo.ambito).length;
  const borradores = seo.altas.filter((a) => a.estado === "Borrador").length;
  const n = (x: number) => (x ? String(x) : undefined);

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
        { href: "/app/seo", label: "Centro de mando", icon: "command" },
        { href: "/app/seo/onboarding", label: "Onboarding", icon: "onboarding", badge: n(borradores) },
        { href: "/app/seo/clientes", label: "Clientes", icon: "clients" },
        { href: "/app/seo/auditorias", label: "Auditorías", icon: "audit", badge: n(porDecidir) },
        { href: "/app/seo/plan", label: "Plan y tareas", icon: "plan", badge: n(abiertas) },
        { href: "/app/seo/agentes", label: "Agentes", icon: "agents" },
        { href: "/app/seo/supervision", label: "Supervisión", icon: "supervision", badge: n(cola) },
        { href: "/app/seo/operaciones", label: "Operaciones", icon: "operations" },
        { href: "/app/seo/informes", label: "Informes", icon: "reports" },
        { href: "/app/seo/geo", label: "Visibilidad IA (GEO)", icon: "geo" },
        { href: "/app/seo/herramientas", label: "Herramientas", icon: "tools" },
        { href: "/app/seo/proyectos", label: "Proyectos", icon: "projects" },
        { href: "/app/seo/configuracion", label: "Configuración", icon: "config" },
      ]}
    >
      {children}
    </Shell>
  );
}
