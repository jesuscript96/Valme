/**
 * LOS MÓDULOS DE LA APLICACIÓN.
 *
 * Cada módulo es un espacio con sus datos, su menú y su ruta raíz. Se elige arriba en la
 * barra lateral y todo lo de dentro es suyo. Añadir un módulo (Paid, Web…) es añadir una
 * línea aquí y su carpeta en `src/app/(os)/app/<ruta>`.
 */
export type Modulo = {
  clave: "cuentas" | "dx" | "seo";
  nombre: string;
  descripcion: string;
  href: string;
  /** Rutas que pertenecen al módulo, para saber cuál está activo. */
  prefijos: string[];
};

export const MODULOS: Modulo[] = [
  {
    clave: "cuentas",
    nombre: "Cuentas",
    descripcion: "Clientes: Brand Kit, ofertas, landings y leads",
    href: "/app/clients",
    prefijos: ["/app/clients", "/app/c/"],
  },
  {
    clave: "dx",
    nombre: "Diagnóstico",
    descripcion: "Leads de Valme y auditorías sin accesos",
    href: "/app/dx",
    prefijos: ["/app/dx"],
  },
  {
    clave: "seo",
    nombre: "SEO · GEO · AEO",
    descripcion: "Auditorías, hallazgos, plan y visibilidad en IA",
    href: "/app/seo",
    prefijos: ["/app/seo"],
  },
];

export const moduloDe = (ruta: string): Modulo =>
  MODULOS.find((m) => m.prefijos.some((p) => ruta === p || ruta.startsWith(p.endsWith("/") ? p : `${p}/`))) ??
  MODULOS[0];
