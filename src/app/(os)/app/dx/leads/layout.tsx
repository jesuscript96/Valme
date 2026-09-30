import { Contenido } from "@/os/ui/Shell";

/** Ventas · Leads: una sola lista y su ficha, sin menú secundario. */
export default function VentasLeadsLayout({ children }: { children: React.ReactNode }) {
  return <Contenido>{children}</Contenido>;
}
