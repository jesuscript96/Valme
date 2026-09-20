import { forClient } from "@/os/repo";
import { PageHeader } from "@/os/ui/primitives";
import { KitStatus } from "@/os/ui/labels";
import { BrandKitTabs } from "./BrandKitTabs";

export const metadata = { title: "Brand Kit · Valme OS" };

/** Pantalla 4 del MD: Identidad / Voz / Negocio / Público / Legal / Assets + Aprobar. */
export default async function BrandKitPage({ params }: { params: Promise<{ client: string }> }) {
  const { client: slug } = await params;
  const scope = await forClient(slug);
  const kit = await scope.brandKit();

  return (
    <>
      <PageHeader
        title="Brand Kit"
        description="Todo lo que se genera después — copys, imágenes, landing, correos — lee de aquí. Por eso nada se genera hasta que está aprobado."
        action={
          <span className="flex items-center gap-3">
            <span className="text-[12px] text-os-faint">v{kit.version}</span>
            <KitStatus s={kit.status} />
          </span>
        }
      />
      <BrandKitTabs kit={kit} canApprove={scope.role !== "operator"} />
    </>
  );
}
