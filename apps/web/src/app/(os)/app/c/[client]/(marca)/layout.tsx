import { forClient } from "@valme/os/repo";
import { MenuArea } from "@valme/os/ui/Shell";

/** Área Marca: lo que todo lo demás lee del cliente. NO autoriza: lo hace `forClient()`. */
export default async function MarcaLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const kit = await scope.brandKit();

  return (
    <MenuArea
      titulo="Marca"
      nav={[
        {
          href: `/app/c/${slug}/brand-kit`, label: "Brand Kit", icon: "kit",
          badge: kit.status === "approved" ? undefined : "por aprobar",
        },
      ]}
    >
      {children}
    </MenuArea>
  );
}
