import { señal, type Señal } from "../../types";

/**
 * STACK TECNOLÓGICO · contexto, no hallazgo.
 *
 * Saber que es WordPress con Elementor casi nunca es un hallazgo: a nadie le sirve que le
 * digas en qué está hecha su web. Sirve para otras dos cosas, las dos importantes:
 * predice dónde va a estar el problema antes de medirlo, y dice qué se puede tocar y a
 * qué coste. Si es Webflow, las landings las hacemos nosotros; si es un desarrollo a
 * medida de hace ocho años, cada cambio pasa por su programador.
 *
 * Por eso estas señales van al bloque de contexto del informe y no a la lista de
 * hallazgos, salvo cuando causan algo concreto.
 */

type Huella = { nombre: string; tipo: "cms" | "constructor" | "ecommerce" | "framework" | "hosting"; patrones: RegExp[] };

const HUELLAS: Huella[] = [
  { nombre: "WordPress", tipo: "cms", patrones: [/wp-content|wp-includes|wp-json/] },
  { nombre: "Webflow", tipo: "cms", patrones: [/webflow\.(com|io)|data-wf-page/] },
  { nombre: "Squarespace", tipo: "cms", patrones: [/squarespace|static1\.squarespace/] },
  { nombre: "Wix", tipo: "cms", patrones: [/wix\.com|wixstatic|_wixCssStates/] },
  { nombre: "Drupal", tipo: "cms", patrones: [/drupal-settings-json|\/sites\/default\/files/] },
  { nombre: "Joomla", tipo: "cms", patrones: [/\/media\/jui\/|joomla/i] },
  { nombre: "Elementor", tipo: "constructor", patrones: [/elementor/] },
  { nombre: "Divi", tipo: "constructor", patrones: [/et_pb_|divi/i] },
  { nombre: "WPBakery", tipo: "constructor", patrones: [/vc_row|js_composer/] },
  { nombre: "Shopify", tipo: "ecommerce", patrones: [/cdn\.shopify|Shopify\.theme/] },
  { nombre: "WooCommerce", tipo: "ecommerce", patrones: [/woocommerce/] },
  { nombre: "PrestaShop", tipo: "ecommerce", patrones: [/prestashop/i] },
  { nombre: "Next.js", tipo: "framework", patrones: [/__NEXT_DATA__|\/_next\//] },
  { nombre: "Nuxt", tipo: "framework", patrones: [/__NUXT__|\/_nuxt\//] },
  { nombre: "Astro", tipo: "framework", patrones: [/astro-island|data-astro/] },
  { nombre: "React", tipo: "framework", patrones: [/data-reactroot|__REACT_DEVTOOLS/] },
];

const HOSTING: [string, RegExp][] = [
  ["Vercel", /vercel/i], ["Netlify", /netlify/i], ["Cloudflare", /cloudflare/i],
  ["AWS CloudFront", /cloudfront/i], ["Fastly", /fastly/i], ["Akamai", /akamai/i],
  ["WP Engine", /wpengine/i], ["SiteGround", /siteground/i],
];

export function detectarStack(html: string, cabeceras: Record<string, string>, url: string): Señal[] {
  const mezcla = html + "\n" + JSON.stringify(cabeceras);
  const detectado = HUELLAS.filter((h) => h.patrones.some((p) => p.test(mezcla)));

  const cabecerasTexto = Object.entries(cabeceras).map(([k, v]) => `${k}: ${v}`).join("\n");
  const cdn = HOSTING.find(([, p]) => p.test(cabecerasTexto))?.[0] ?? null;

  const base = { funcion: 7 as const, fuente: "Cabeceras y HTML", url, estado: "verificado" as const };
  const por = (t: Huella["tipo"]) => detectado.filter((d) => d.tipo === t).map((d) => d.nombre);

  return [
    señal({ ...base, id: "stack.cms", que: "Gestor de contenidos", valor: por("cms")[0] ?? null }),
    señal({ ...base, id: "stack.constructor", que: "Constructor visual", valor: por("constructor")[0] ?? null,
      limite: por("constructor").length
        ? "Los constructores visuales generan mucho HTML y CSS: suele explicar parte del problema de velocidad"
        : undefined }),
    señal({ ...base, id: "stack.ecommerce", que: "Plataforma de comercio", valor: por("ecommerce")[0] ?? null }),
    señal({ ...base, id: "stack.framework", que: "Framework", valor: por("framework")[0] ?? null }),
    señal({ ...base, id: "stack.cdn", que: "CDN o proveedor detectado", valor: cdn }),
    señal({ ...base, id: "stack.servidor", que: "Servidor declarado",
      valor: cabeceras["server"] ?? cabeceras["x-powered-by"] ?? null }),
  ];
}
