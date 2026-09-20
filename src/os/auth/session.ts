import "server-only";
import { cookies } from "next/headers";

/**
 * SESIÓN — hoy falsa, mañana Supabase Auth.
 *
 * Este módulo es la ÚNICA parte del código que sabe cómo se representa una sesión.
 * Nadie más lee la cookie. Cambiar a Supabase Auth debe ser reescribir las funciones
 * de este fichero sin tocar nada que las llame.
 *
 * ADVERTENCIA: un login falso NO es control de acceso. La cookie va firmada con HMAC y
 * la contraseña es compartida, lo que deja fuera a curiosos y buscadores — nada más.
 * Mientras esto siga así: ningún dato real de cliente y ningún token de integración.
 */

export const SESSION_COOKIE = "valme_os_session";
const TTL_SECONDS = 8 * 60 * 60;

export type Role = "admin" | "strategist" | "operator";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
};

function secret(): string {
  const s = process.env.OS_SESSION_SECRET;
  if (!s) {
    // Un fallo ruidoso en arranque es mejor que sesiones firmadas con "" en producción.
    if (process.env.NODE_ENV === "production") {
      throw new Error("OS_SESSION_SECRET no está configurado");
    }
    return "dev-only-insecure-secret";
  }
  return s;
}

const b64url = (b: ArrayBuffer | Uint8Array) =>
  Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

/** Comparación en tiempo constante: una comparación normal filtra la firma byte a byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function encodeSession(s: Session): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(s)));
  return `${body}.${await sign(body)}`;
}

/**
 * Verifica firma y caducidad. Devuelve null ante cualquier problema — nunca lanza, porque
 * la llama el proxy en cada petición y una cookie corrupta no debe ser un error 500.
 */
export async function decodeSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await sign(body))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (typeof s?.exp !== "number" || s.exp * 1000 < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function newSession(u: { id: string; email: string; name: string; role: Role }): Session {
  return {
    userId: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
}

export async function writeSessionCookie(s: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await encodeSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<Session | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}
