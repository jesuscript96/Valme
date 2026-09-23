# Auditoría sin accesos

Recolector determinista. De un dominio a hallazgos, sin IA y sin credenciales del
prospecto.

```bash
npm run audit -- undominio.com
npm run audit -- undominio.com --json salida.json
```

## Cómo está montado

```
types.ts          Señal (hecho observado) y Hallazgo (juicio derivado)
signatures.ts     catálogo de tags y píxeles
collect/dns.ts    SPF, DKIM, DMARC, MX
collect/http.ts   redirecciones, robots, sitemap, llms.txt, 404, cabeceras
collect/runtime.ts Chrome headless: la autoridad sobre qué hay instalado
collect/adlib.ts  Meta Ad Library (necesita token)
rules.ts          señales → hallazgos. Determinista.
run.ts            orquestador
```

## Tres reglas que sostienen el resultado

**1 · El runtime manda sobre el HTML.** Buscar `fbq(` en el código da falsos positivos y
falsos negativos a la vez. Comprobado: el scan estático dijo que valmesolutions.com tenía
GA4 y el navegador demostró que `gtag` es `undefined`. El estático solo sirve para extraer
identificadores de lo que el runtime ya ha confirmado.

**2 · Una señal no verificada bloquea su regla.** Ausencia de dato no es hallazgo. Si la
página tiene banner de cookies y no se ve el píxel, la señal baja a `parcial` y la regla
que diría «no tienes píxel» no se dispara. Es la diferencia entre no saber y afirmar.

**3 · Toda fuente caída se declara.** Sin token de Ad Library no se dice que no tiene
anuncios: se dice que no se ha podido comprobar, y sale en la portada.

## Lo que falta por credenciales

| Fuente | Qué aporta | Cómo |
| --- | --- | --- |
| `META_ADLIB_TOKEN` | Anuncios activos, antigüedad, rotación, formatos | App de Meta, la misma que para crear campañas |
| `PAGESPEED_API_KEY` | Lighthouse y Core Web Vitals reales | Clave de Google Cloud, gratis. Sin ella la cuota anónima está siempre agotada |

## Limitación conocida

Un banner de cookies que bloquee de verdad impide ver los tags que estén detrás del
consentimiento. La solución es pasar dos veces, antes y después de aceptar, y esa segunda
pasada es además la comprobación de si el banner bloquea algo o es decorativo. Mientras
tanto, la señal se marca `parcial` con el motivo escrito.
