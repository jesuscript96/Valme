import { redirect } from "next/navigation";
import { listVisibleClients } from "@/os/repo";
import { readLastClient } from "@/os/tenancy/lastClient";

/**
 * `/app` no tiene contenido propio: te devuelve donde estabas.
 * El ámbito real siempre vive en la URL, así que esto sólo elige a qué URL ir.
 */
export default async function AppIndex() {
  const clients = await listVisibleClients();
  if (clients.length === 0) redirect("/app/clients");

  const last = await readLastClient();
  const target = clients.find((c) => c.slug === last) ?? clients[0];
  redirect(`/app/c/${target.slug}`);
}
