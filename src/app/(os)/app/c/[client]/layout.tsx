import { forClient, listVisibleClients } from "@/os/repo";
import { Shell, clientNav } from "@/os/ui/Shell";

/**
 * Este layout pinta el marco. NO autoriza: en Next 16 un layout no controla si sus hijos
 * se ejecutan. La autorización la hace `forClient()`, que llama también cada página.
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const [all, kit, offers, leadCount] = await Promise.all([
    listVisibleClients(),
    scope.brandKit(),
    scope.offers.list(),
    scope.leads.countSince(30),
  ]);

  return (
    <Shell
      user={{ name: scope.member.name, email: scope.member.email, role: scope.role }}
      clients={all.map((c) => ({ slug: c.slug, name: c.name, status: c.status }))}
      current={{ slug: scope.client.slug, name: scope.client.name, status: scope.client.status }}
      nav={clientNav(slug, {
        kitApproved: kit.status === "approved",
        offerCount: offers.length,
        leadCount,
        isAdmin: scope.role === "admin",
      })}
    >
      {children}
    </Shell>
  );
}
