import { forClient } from "@/os/repo";

const HEADERS = [
  "fecha", "nombre", "email", "telefono", "respuestas", "utm_source", "utm_medium",
  "utm_campaign", "utm_content", "fbclid", "consentimiento", "estado_correo",
] as const;

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * Exportación CSV. Se genera en streaming: 10.000 leads no deben cargar en memoria, y
 * el navegador empieza a descargar sin esperar a la última fila.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ client: string }> },
) {
  const { client: slug } = await params;
  const scope = await forClient(slug);

  const offer = new URL(req.url).searchParams.get("offer") ?? undefined;
  const leads = await scope.leads.list({ offerId: offer });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode("﻿" + HEADERS.join(",") + "\r\n"));
      for (const l of leads) {
        controller.enqueue(
          enc.encode(
            [
              l.createdAt, l.name ?? "", l.email ?? "", l.phone ?? "",
              JSON.stringify(l.answers),
              l.utm.source ?? "", l.utm.medium ?? "", l.utm.campaign ?? "", l.utm.content ?? "",
              l.fbclid ?? "", l.consent ? "sí" : "no", l.emailStatus,
            ]
              .map(cell)
              .join(",") + "\r\n",
          ),
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
