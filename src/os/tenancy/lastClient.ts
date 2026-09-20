import "server-only";
import { cookies } from "next/headers";

/**
 * Recuerda el último cliente visitado para que `/app` devuelva a donde estabas.
 *
 * Es SÓLO una comodidad de navegación: el ámbito real va en la URL (`/app/c/<slug>/…`)
 * y se valida contra la pertenencia en cada consulta. Esta cookie nunca concede acceso.
 *
 * Se escribe desde `src/proxy.ts`, no desde un layout: en Next 16 las cookies sólo se
 * pueden modificar en Server Actions, route handlers y el proxy.
 */
export const LAST_CLIENT_COOKIE = "valme_os_last_client";

export async function readLastClient(): Promise<string | null> {
  return (await cookies()).get(LAST_CLIENT_COOKIE)?.value ?? null;
}
