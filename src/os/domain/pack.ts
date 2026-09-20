import type { AdCreative } from "@/os/repo/types";
import { buildUrlTags } from "./utm";

/**
 * "Descargar pack" — el plan B del MD mientras Meta no aprueba el Advanced Access.
 *
 * No es un apaño: es lo que permite que el piloto capte leads reales en la semana 8
 * aunque la API no esté. Y es también la forma de probar anuncios ANTES de tener la
 * integración, por lo que conviene construirlo en el sprint 2 y no en el 4.
 */

const CSV_HEADERS = [
  "id", "angulo", "variante", "texto_principal", "titulo", "descripcion", "cta", "url_con_utms",
] as const;

/** Comillas dobles duplicadas y campo entrecomillado: los copys llevan saltos de línea. */
function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function buildCopyCsv(creatives: AdCreative[], landingUrl: string | null): string {
  const rows = creatives.map((c) =>
    [
      c.id,
      c.angle,
      String(c.variant),
      c.primaryText,
      c.headline,
      c.description,
      c.cta,
      landingUrl ? `${landingUrl}?${buildUrlTags(c.id)}` : "",
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM para que Excel en español no rompa los acentos.
  return "﻿" + [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

export function packFileName(offerName: string): string {
  const slug = offerName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `pack-${slug}-${new Date().toISOString().slice(0, 10)}`;
}

/** Nombre de cada imagen dentro del ZIP: legible al subirla a mano en Ads Manager. */
export function assetFileName(c: AdCreative, format: string): string {
  return `${c.angle}-v${c.variant}-${format.replace(":", "x")}.png`;
}
