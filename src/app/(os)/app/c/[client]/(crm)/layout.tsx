import { forClient } from "@/os/repo";
import { MenuArea } from "@/os/ui/Shell";

/** Área CRM · Leads: lo que entra por las landings del cliente. NO autoriza: lo hace `forClient()`. */
export default async function CrmLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const recientes = await scope.leads.countSince(30);

  return (
    <MenuArea
      titulo="CRM · Leads"
      nav={[
        { href: `/app/c/${slug}/leads`, label: "Leads", icon: "leads", badge: recientes ? String(recientes) : undefined },
      ]}
    >
      {children}
    </MenuArea>
  );
}
