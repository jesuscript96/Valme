import { requireMember } from "@/os/auth/dal";
import { Shell } from "@/os/ui/Shell";
import { HERRAMIENTAS, CLAVES } from "@/os/audit/tools";

/**
 * Layout del lado DIAGNÓSTICO.
 *
 * No recibe cliente: aquí los datos son de Valme. La navegación es la misma para todo el
 * equipo, y las herramientas aparecen sueltas porque se pueden usar sin lead.
 */
export default async function DxLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();

  return (
    <Shell
      contexto="dx"
      user={{ name: member.name, email: member.email, role: member.role }}
      clients={[]}
      current={null}
      nav={[
        { href: "/app/dx/leads", label: "Leads", icon: "leads" },
        { href: "/app/dx/tools", label: "Herramientas", icon: "tools" },
        ...CLAVES.map((c) => ({
          href: `/app/dx/tools/${c}`,
          label: HERRAMIENTAS[c].nombre.replace("Auditoría ", "").replace("de ", ""),
          icon: "audit" as const,
        })),
      ]}
    >
      {children}
    </Shell>
  );
}
