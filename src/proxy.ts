import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/os/auth/session";
import { LAST_CLIENT_COOKIE } from "@/os/tenancy/lastClient";

const CLIENT_PATH = /^\/app\/c\/([^/]+)/;

/**
 * En Next.js 16 `middleware.ts` está deprecado y se llama `proxy.ts`.
 *
 * Hace dos cosas, las dos baratas:
 *  1. Comprobación OPTIMISTA de sesión, para no cargar el área y rebotar. La autorización
 *     de verdad vive en la capa de datos (`src/os/auth/dal.ts`), que ejecuta cada página
 *     y cada acción. Aquí no se consulta nada: el proxy corre también en los prefetch.
 *  2. Recuerda el último cliente visitado. Es el único sitio del flujo de lectura que
 *     puede escribir una cookie — desde un layout, Next lo prohíbe.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await decodeSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/app") && !session) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/app", req.nextUrl));
  }

  const res = NextResponse.next();

  const slug = CLIENT_PATH.exec(pathname)?.[1];
  if (session && slug && req.cookies.get(LAST_CLIENT_COOKIE)?.value !== slug) {
    res.cookies.set(LAST_CLIENT_COOKIE, slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
