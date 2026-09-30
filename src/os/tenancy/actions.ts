"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { listVisibleClients } from "@/os/repo";
import { CLIENT_COOKIE_OPTIONS, LAST_CLIENT_COOKIE } from "./lastClient";

/**
 * Cambia el cliente activo desde el selector. Una cadena vacía es «Todos los clientes».
 * Un slug que la persona no puede ver se trata igual que vacío: nunca se guarda.
 */
export async function elegirClienteActivo(slug: string): Promise<void> {
  const visibles = await listVisibleClients();
  const jar = await cookies();
  if (slug && visibles.some((c) => c.slug === slug)) {
    jar.set(LAST_CLIENT_COOKIE, slug, CLIENT_COOKIE_OPTIONS);
  } else {
    jar.delete({ name: LAST_CLIENT_COOKIE, path: "/" });
  }
  revalidatePath("/app", "layout");
}
