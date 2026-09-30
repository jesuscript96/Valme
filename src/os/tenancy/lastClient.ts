import "server-only";
import { cookies } from "next/headers";

/**
 * EL CLIENTE ACTIVO: el que está elegido en el selector del menú principal.
 *
 * Sirve a todas las áreas del espacio Clientes. Las de un solo cliente (Paid, CRM…) lo
 * llevan además en la URL (`/app/c/<slug>/…`), y ahí manda la URL; SEO · GEO · AEO trabaja
 * sobre toda la cartera y lo usa como filtro. Sin cookie es «Todos los clientes».
 *
 * Es SÓLO una comodidad de navegación: el acceso se valida contra la pertenencia en cada
 * consulta. Esta cookie nunca concede acceso.
 *
 * La escriben `src/proxy.ts` al entrar en un cliente y `elegirClienteActivo()` desde el
 * selector: en Next 16 las cookies sólo se pueden modificar en Server Actions, route
 * handlers y el proxy.
 */
export const LAST_CLIENT_COOKIE = "valme_os_last_client";

export const CLIENT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 90,
} as const;

export async function readLastClient(): Promise<string | null> {
  return (await cookies()).get(LAST_CLIENT_COOKIE)?.value || null;
}
