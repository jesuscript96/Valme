import { CLAVES, HERRAMIENTAS } from "@valme/os/audit/tools";
import { MenuArea } from "@valme/os/ui/Shell";

/**
 * Ventas · Auditorías. Las herramientas se pueden usar sin lead: pegas un dominio y sale
 * el informe. Los datos son de Valme, así que no hay cliente activo.
 */
export default function VentasAuditoriasLayout({ children }: { children: React.ReactNode }) {
  return (
    <MenuArea
      titulo="Auditorías"
      ambito="Sin accesos, desde un dominio"
      nav={[
        { href: "/app/dx/tools", label: "Todas", icon: "tools" },
        ...CLAVES.map((c) => ({
          href: `/app/dx/tools/${c}`,
          label: HERRAMIENTAS[c].nombre.replace("Auditoría ", "").replace("de ", ""),
          icon: "audit" as const,
        })),
      ]}
    >
      {children}
    </MenuArea>
  );
}
