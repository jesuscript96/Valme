"use server";

import { redirect } from "next/navigation";
import { findMemberByEmail } from "@/os/data/members";
import { clearSessionCookie, newSession, writeSessionCookie } from "./session";

export type LoginState = { error: string | null };

/** Retardo fijo: sin él, "email desconocido" responde antes que "contraseña mala". */
const settle = () => new Promise((r) => setTimeout(r, 350));

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/app");

  await settle();

  const member = findMemberByEmail(email);
  const expected = process.env.OS_ACCESS_PASSWORD ?? "valme";

  // Un solo mensaje para los dos fallos: no revelamos qué emails existen.
  if (!member || password !== expected) {
    return { error: "Email o contraseña incorrectos." };
  }

  await writeSessionCookie(
    newSession({ id: member.id, email: member.email, name: member.name, role: member.role }),
  );

  // Sólo rutas internas: un `next` absoluto sería un redirect abierto.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
