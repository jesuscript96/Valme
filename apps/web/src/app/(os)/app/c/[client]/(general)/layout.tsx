import { Contenido } from "@valme/os/ui/Shell";

/** Inicio del cliente e Integraciones: sin menú secundario. */
export default function ClienteGeneralLayout({ children }: { children: React.ReactNode }) {
  return <Contenido>{children}</Contenido>;
}
