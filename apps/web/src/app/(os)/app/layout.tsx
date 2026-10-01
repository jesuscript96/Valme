import { requireMember } from "@valme/os/auth/dal";
import { listVisibleClients } from "@valme/os/repo";
import { readLastClient } from "@valme/os/tenancy/lastClient";
import { Shell } from "@valme/os/ui/Shell";

/**
 * Marco de todo `/app`: el menú principal se pinta aquí una sola vez y cada área pone al
 * lado su menú secundario. NO autoriza: en Next 16 un layout no controla si sus hijos se
 * ejecutan. Cada página y cada acción pasa por el DAL.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();
  const [clients, ultimo] = await Promise.all([listVisibleClients(), readLastClient()]);

  return (
    <Shell
      user={{ name: member.name, email: member.email, role: member.role }}
      clients={clients.map((c) => ({ slug: c.slug, name: c.name, status: c.status }))}
      activo={clients.some((c) => c.slug === ultimo) ? ultimo : null}
    >
      {children}
    </Shell>
  );
}
