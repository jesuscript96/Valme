import { requireMember } from "@/os/auth/dal";
import { listVisibleClients } from "@/os/repo";
import { Shell } from "@/os/ui/Shell";

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();
  const clients = await listVisibleClients();

  return (
    <Shell
      user={{ name: member.name, email: member.email, role: member.role }}
      clients={clients.map((c) => ({ slug: c.slug, name: c.name, status: c.status }))}
      current={null}
      nav={[{ href: "/app/clients", label: "Clientes", icon: "clients" }]}
    >
      {children}
    </Shell>
  );
}
