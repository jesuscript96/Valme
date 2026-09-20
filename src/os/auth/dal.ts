import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie, type Session } from "./session";
import { memberById, type Member } from "@/os/data/members";

/**
 * CAPA DE ACCESO A DATOS (DAL).
 *
 * En Next 16 un `layout.tsx` NO protege lo que cuelga de él: por el renderizado parcial
 * no se re-renderiza al navegar, y no controla si los segmentos hijos se ejecutan ni si
 * aparecen en el payload RSC. Por eso la comprobación vive aquí y la llama cada página,
 * cada Server Action y cada route handler que toca datos — nunca un layout.
 *
 * `cache` de React memoiza durante un render, así que llamarlo N veces cuesta una.
 */

export const getSession = cache(async (): Promise<Session | null> => readSessionCookie());

export const requireSession = cache(async (): Promise<Session> => {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
});

export const requireMember = cache(async (): Promise<{ session: Session; member: Member }> => {
  const session = await requireSession();
  const member = memberById(session.userId);
  // La cookie es válida pero el miembro ya no existe (le han quitado el acceso).
  if (!member) redirect("/login");
  return { session, member };
});
