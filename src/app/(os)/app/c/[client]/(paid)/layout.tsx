import { forClient } from "@/os/repo";
import { MenuArea } from "@/os/ui/Shell";

/**
 * Área Paid: ofertas (con su estudio de anuncios y su lanzamiento) y landings. Lo que
 * no se puede hacer aún sale bloqueado y dice por qué. NO autoriza: lo hace `forClient()`.
 */
export default async function PaidLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const [kit, offers] = await Promise.all([scope.brandKit(), scope.offers.list()]);
  const base = `/app/c/${slug}`;

  return (
    <MenuArea
      titulo="Paid"
      nav={[
        {
          href: `${base}/offers`, label: "Ofertas", icon: "offers",
          blockedBecause: kit.status === "approved" ? undefined : "Aprueba antes el Brand Kit",
          badge: offers.length ? String(offers.length) : undefined,
        },
        {
          href: `${base}/landings`, label: "Landings", icon: "landings",
          blockedBecause: offers.length ? undefined : "Crea antes una oferta",
        },
      ]}
    >
      {children}
    </MenuArea>
  );
}
