/**
 * EL MAPA DE LA APLICACIÓN.
 *
 * Dos espacios que no se mezclan, porque sus datos tampoco:
 *  - VENTAS: lo de antes de firmar. Leads de Valme y auditorías sin accesos.
 *  - CLIENTES: lo de después. Cada área (Paid, SEO…) trabaja sobre el cliente activo.
 *
 * Cada área es una entrada del menú principal. Inicio y las áreas de una sola pantalla
 * dejan el menú principal abierto; las que tienen menú propio lo pliegan a iconos y
 * abren al lado su menú secundario, que pinta el layout del área.
 *
 * Las URLs no se tocan: el mapa se apoya en los prefijos que ya existen. Añadir un área
 * es añadir una entrada aquí y su carpeta en `src/app/(os)/app/…`.
 */

export type Espacio = "ventas" | "clientes";

export type ClaveArea =
  | "ventas-leads" | "ventas-auditorias"
  | "inicio" | "marca" | "paid" | "seo" | "crm" | "integraciones";

export type Icono =
  | "inicio" | "marca" | "paid" | "seo" | "crm" | "integraciones" | "leads" | "auditorias";

export type Area = {
  clave: ClaveArea;
  espacio: Espacio;
  nombre: string;
  icono: Icono;
  /**
   * `true` si el área solo existe dentro de un cliente (`/app/c/<slug>/…`). Sin cliente
   * activo, su entrada lleva a la lista de clientes para elegir uno.
   */
  porCliente: boolean;
  /** Si tiene menú secundario: el principal se pliega a iconos. */
  conMenu: boolean;
  /** Solo para administradores. */
  soloAdmin?: boolean;
  /** Dónde lleva la entrada del menú principal. `slug` es el cliente activo, si lo hay. */
  href: (slug: string | null) => string;
  /** Si la ruta es de esta área. Recibe la ruta sin el prefijo `/app/c/<slug>` cuando lo hay. */
  incluye: (ruta: string, dentroDeCliente: boolean) => boolean;
};

const bajo = (ruta: string, prefijo: string) => ruta === prefijo || ruta.startsWith(`${prefijo}/`);

/** Sin cliente activo, un área de cliente abre la lista para elegir uno. */
const elegirCliente = (clave: ClaveArea) => `/app/clients?area=${clave}`;

export const AREAS: Area[] = [
  {
    clave: "ventas-leads", espacio: "ventas", nombre: "Leads", icono: "leads",
    porCliente: false, conMenu: false,
    href: () => "/app/dx/leads",
    incluye: (r) => r === "/app/dx" || bajo(r, "/app/dx/leads"),
  },
  {
    clave: "ventas-auditorias", espacio: "ventas", nombre: "Auditorías", icono: "auditorias",
    porCliente: false, conMenu: true,
    href: () => "/app/dx/tools",
    incluye: (r) => bajo(r, "/app/dx/tools"),
  },
  {
    clave: "inicio", espacio: "clientes", nombre: "Inicio", icono: "inicio",
    porCliente: false, conMenu: false,
    href: (slug) => (slug ? `/app/c/${slug}` : "/app"),
    incluye: (r, dentro) => (dentro ? r === "" : r === "/app" || bajo(r, "/app/clients")),
  },
  {
    clave: "marca", espacio: "clientes", nombre: "Marca", icono: "marca",
    porCliente: true, conMenu: true,
    href: (slug) => (slug ? `/app/c/${slug}/brand-kit` : elegirCliente("marca")),
    incluye: (r, dentro) => dentro && bajo(r, "/brand-kit"),
  },
  {
    clave: "paid", espacio: "clientes", nombre: "Paid", icono: "paid",
    porCliente: true, conMenu: true,
    href: (slug) => (slug ? `/app/c/${slug}/offers` : elegirCliente("paid")),
    incluye: (r, dentro) => dentro && (bajo(r, "/offers") || bajo(r, "/landings")),
  },
  {
    clave: "seo", espacio: "clientes", nombre: "SEO · GEO · AEO", icono: "seo",
    porCliente: false, conMenu: true,
    href: () => "/app/seo",
    incluye: (r) => bajo(r, "/app/seo"),
  },
  {
    clave: "crm", espacio: "clientes", nombre: "CRM · Leads", icono: "crm",
    porCliente: true, conMenu: true,
    href: (slug) => (slug ? `/app/c/${slug}/leads` : elegirCliente("crm")),
    incluye: (r, dentro) => dentro && bajo(r, "/leads"),
  },
  {
    clave: "integraciones", espacio: "clientes", nombre: "Integraciones", icono: "integraciones",
    porCliente: true, conMenu: false, soloAdmin: true,
    href: (slug) => (slug ? `/app/c/${slug}/settings` : elegirCliente("integraciones")),
    incluye: (r, dentro) => dentro && bajo(r, "/settings"),
  },
];

export const ESPACIOS: { clave: Espacio; nombre: string; href: string }[] = [
  { clave: "ventas", nombre: "Ventas", href: "/app/dx/leads" },
  { clave: "clientes", nombre: "Clientes", href: "/app" },
];

const CLIENTE = /^\/app\/c\/([^/]+)(.*)$/;

/** El slug de la URL, si la ruta es de un cliente. */
export const slugDeRuta = (ruta: string): string | null => CLIENTE.exec(ruta)?.[1] ?? null;

/** El área de una ruta. Lo que no encaja en ninguna cae en Inicio. */
export function areaDe(ruta: string): Area {
  const m = CLIENTE.exec(ruta);
  const resto = m ? m[2] : ruta;
  return AREAS.find((a) => a.incluye(resto, Boolean(m))) ?? AREAS.find((a) => a.clave === "inicio")!;
}

export const areaPorClave = (clave: string | null | undefined): Area | null =>
  AREAS.find((a) => a.clave === clave) ?? null;

/**
 * Adónde ir al cambiar de cliente sin salir del área.
 *
 * Dentro de un cliente se cambia el slug y se conserva la sección, así que se queda en la
 * misma pantalla: de Leads de Nordic a Leads de Rivas. El detalle (una oferta, un lead) es
 * del cliente anterior, así que se sube a su lista. `null` es «Todos los clientes».
 */
export function destinoAlCambiar(ruta: string, slug: string | null): string {
  const area = areaDe(ruta);
  if (!area.porCliente && area.clave !== "inicio") return ruta; // SEO: el filtro va en la cookie
  if (!slug) return area.href(null);
  const seccion = CLIENTE.exec(ruta)?.[2].split("/")[1];
  return seccion ? `/app/c/${slug}/${seccion}` : area.href(slug);
}
