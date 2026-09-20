/**
 * UTMs de la creatividad. Puro: lo usan el pack descargable, la pantalla de lanzamiento
 * y el cliente de Meta, y ninguno de esos tres debe arrastrar `server-only`.
 *
 * `utm_content` lleva el id INTERNO del anuncio, no el de Meta: así el lead sigue atado
 * al anuncio aunque en Ads Manager lo renombren o lo dupliquen.
 * `{{campaign.name}}` lo sustituye Meta en el momento del clic, y va SIN escapar.
 */
export function buildUrlTags(creativeId: string): string {
  return [
    "utm_source=facebook",
    "utm_medium=paid",
    "utm_campaign={{campaign.name}}",
    `utm_content=${encodeURIComponent(creativeId)}`,
  ].join("&");
}
