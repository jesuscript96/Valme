import { Contenido } from "@valme/os/ui/Shell";

/** Inicio y la cartera de clientes: sin menú secundario, el principal va abierto. */
export default function InicioLayout({ children }: { children: React.ReactNode }) {
  return <Contenido>{children}</Contenido>;
}
