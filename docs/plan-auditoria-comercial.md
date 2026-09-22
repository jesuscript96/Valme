# Auditoría comercial desde un dominio

Cómo auditar a un cliente potencial con lo único que tenemos en fase de venta: su dominio.
Sin accesos, sin cuentas, sin que nadie nos dé permisos.

Parte del one-pager de *Equipo de marketing* y de la lista del grupo. Donde la lista decía
"¿?", aquí hay una respuesta o un "esto no se puede saber sin accesos", que también es una
respuesta.

---

## 1. La idea en una frase

**Se audita exactamente lo que se vende.**

El one-pager ya define ocho funciones con su reparto por defecto. Esa tabla no es material
de marketing: es un modelo de puntuación terminado.

| # | Función | Peso |
| --- | --- | --- |
| 01 | Dirección y estrategia | 9 % |
| 02 | Paid media | 15 % |
| 03 | SEO, contenido y GEO | 16 % |
| 04 | Social orgánico | 15 % |
| 05 | Creatividad, diseño y vídeo | 15 % |
| 06 | Mensaje y copy | 5 % |
| 07 | Web, landings y CRO | 13 % |
| 08 | Datos, CRM y leads | 12 % |

Un módulo de auditoría por función. Ocho notas de 0 a 100, una nota global ponderada, y el
entregable final: **el reparto por defecto ajustado a lo que hemos encontrado.**

Eso es literalmente la propuesta. El one-pager dice *"se ajusta el peso, no la cobertura"*;
la auditoría es el documento que justifica el ajuste. No se vende después de la auditoría:
la auditoría **es** la venta.

Y un extra que sale gratis: la auditoría rastrea la web, el mensaje y la identidad visual
del cliente. Son los mismos datos que necesita el Brand Kit de Valme OS. **Un cliente que
firma llega con su Brand Kit medio hecho**, porque se extrajo cuando todavía era un
prospecto.

---

## 2. Qué se puede saber sin accesos

Lo primero, con honestidad, porque condiciona todo lo demás.

| | Sin accesos | Hace falta acceso |
| --- | --- | --- |
| **Paid** | Anuncios activos, desde cuándo, creatividades, copys, formatos, plataformas, CTA, a dónde llevan, píxeles instalados y qué eventos disparan | Inversión, CPL, ROAS, segmentaciones, histórico de rendimiento |
| **Web / SEO** | Todo lo técnico, contenido, Core Web Vitals reales de campo, schema, indexabilidad, cadencia de blog | Search Console: consultas reales, impresiones, posiciones |
| **GEO** | Si aparecen o no en respuestas de IA para su categoría | — (esto se mide igual desde fuera) |
| **Social** | Perfiles, seguidores, último post, cadencia, interacción aproximada | Alcance, guardados, tráfico que generan |
| **Creatividad** | Todas las creatividades que corren en paid, y la web entera | El archivo de marca, lo que probaron y descartaron |
| **Mensaje** | Todo. Es texto público | — |
| **CRO** | Formularios, campos, CTAs, móvil, velocidad, señales de confianza | Tasa de conversión real, mapas de calor, embudo |
| **Datos / CRM** | Qué herramientas tienen instaladas, SPF/DKIM/DMARC, a dónde va el formulario, **cuánto tardan en contestar** | Volumen de leads, tasa de cierre, ciclo de venta |

**La columna de la izquierda da para un diagnóstico que duele.** Falta el "cuánto", pero
está todo el "cómo", y el "cómo" es lo que se arregla.

Además, no saber el "cuánto" tiene una ventaja comercial: obliga a que sea el prospecto
quien ponga sus números encima de la mesa. Esa es la conversación que quieres.

---

## 3. Los ocho módulos

Cada uno corre solo o con los demás. Cada uno produce **señales** (hechos observados, con
su fuente y su fecha) y **hallazgos** (juicios, con severidad y con la función que lo
arregla).

### 02 · Paid media

El más automatizable, y casi nadie lo aprovecha.

**Fuente principal: la Ad Library API de Meta.** Por la DSA, todos los anuncios que llegan
a la UE están en la biblioteca, no solo los políticos. Con `ad_reached_countries: ['ES']` y
el ID de su página se obtiene su estrategia de paid entera, gratis y de forma oficial.

Señales: nº de anuncios activos · fecha de inicio de cada uno · nº de creatividades
distintas · formatos · plataformas (FB, IG, Audience, Messenger) · CTA · URL de destino ·
si las URLs llevan UTMs · si hay vídeo. En Google, lo mismo desde el Centro de
Transparencia de Anuncios. Y en su web: qué píxeles hay instalados y qué eventos disparan.

Hallazgos que salen una y otra vez:

- *"Llevas siete meses con los mismos dos anuncios."* — La fecha de inicio es pública. Es
  el dato más incómodo de toda la auditoría.
- *"Todo tu tráfico de pago va a la home."* — Se ve en la URL de destino.
- *"Tienes el píxel puesto pero no dispara ningún evento de conversión."* — Se ve mirando
  la red del navegador. Significa que Meta optimiza a ciegas.
- *"No tienes Conversions API."* — Inferible. Todo lo que dependa del navegador se pierde
  con el rechazo de cookies.

### 03 · SEO, contenido y GEO

**Técnico** (Firecrawl + comprobaciones directas): robots.txt · sitemap.xml · canonicals ·
hreflang · titles y metas duplicados o vacíos · estructura de H1 · schema.org · 404 · HTTPS
y cadenas de redirección · profundidad de clic.

**Contenido**: nº de páginas indexables · existencia de blog · fecha del último post ·
cadencia de los últimos 12 meses · páginas por servicio o solo una genérica.

**GEO** — y esta es la parte que nadie está haciendo todavía. Se le pregunta a tres modelos
distintos *"¿qué empresas hacen [su categoría] en [su ciudad]?"* y se mira si aparecen, en
qué puesto y qué se dice de ellos. Se repite con cinco consultas de su embudo.

> Salir o no salir en la respuesta de una IA es, hoy, tan verificable como salir en Google —
> y mucho más fácil de enseñar en una reunión. Es el único apartado de la auditoría del que
> el prospecto no ha oído hablar, y el que mejor justifica la letra "GEO" de la función 03.

Se comprueba también `llms.txt`, que casi nadie tiene y es barato de poner.

### 07 · Web, landings y CRO

**Velocidad con datos reales, no de laboratorio.** La API de PageSpeed Insights da
Lighthouse; la API de CrUX da los Core Web Vitals **de usuarios reales** de los últimos 28
días, si el sitio tiene tráfico suficiente. Las dos son gratis.

La diferencia importa en una reunión: "tu web tarda 4,8 s en cargar **para tus visitantes
de móvil de este mes**" no se discute igual que un número de laboratorio.

Señales: LCP, INP y CLS de campo, móvil y escritorio · nº de campos del formulario ·
obligatorios frente a opcionales · CTA visible sin hacer scroll · nº de CTAs distintos por
página · versión móvil real · señales de confianza (testimonios, logos, teléfono, garantía) ·
banner de cookies y si bloquea de verdad · herramientas de test A/B detectadas · si el
anuncio lleva a una landing dedicada o a la home.

### 08 · Datos, CRM y leads

**Detección de herramientas** desde el HTML y la red: GA4 · GTM · Consent Mode · píxeles ·
CRM (HubSpot, Salesforce, Pipedrive, Zoho) · chat · Calendly · a dónde apunta el `action`
del formulario.

**DNS, en 200 ms y gratis**: SPF, DKIM y DMARC. La mayoría de las pymes no tiene DMARC y no
lo sabe. Se traduce solo: *"una parte de tus correos comerciales está yendo a spam"*.

**Y el tiempo de respuesta.** Rellenar su formulario y cronometrar. Es, con diferencia, el
dato más potente de toda la auditoría: *"rellenamos vuestro formulario el martes a las 10:14.
Hoy es jueves."*

> **Con condiciones, y son importantes.** Se hace con datos reales de Valme, nunca
> inventados. Una decisión humana por prospecto, nunca automatizado en masa: un script que
> rellena doscientos formularios es spam, y además es rastreable hasta vosotros. Y se cuenta
> en la reunión: *"probamos vuestro circuito, esto es lo que pasó"*. Dicho así es
> profesional; ocultado, es otra cosa.

### 06 · Mensaje y copy

Cero herramientas externas: es texto público y un modelo leyéndolo.

Señales: cuál es la propuesta de valor y en cuántas palabras · si hay un diferencial
concreto o adjetivos · si hay prueba verificable · jerga y palabras vacías · coherencia
entre home, servicios y los anuncios que corren en paid.

**La prueba del logo tapado**: se coge su hero y el de tres competidores, se tapan los
logos y se pregunta cuál es cuál. Cuando no se distingue, el hallazgo se demuestra solo.

### 05 · Creatividad, diseño y vídeo

Las creatividades de la Ad Library más capturas de su web, analizadas por un modelo con
visión.

Señales: nº de creatividades distintas · si hay vídeo en algún canal · si hay formato
vertical · si la marca aparece en la creatividad · coherencia visual entre anuncios y web ·
si las fotos son de banco de imágenes o propias.

### 04 · Social orgánico

**El más difícil de automatizar, y conviene decirlo desde el principio.** Instagram y
LinkedIn no dan API pública sin el acceso del propio cliente, y rastrearlos va contra sus
términos de uso.

Tres caminos, y recomiendo el primero:

1. **Manual con rúbrica, cinco minutos.** Un comercial abre los dos perfiles y rellena seis
   campos. Con una rúbrica fija es consistente entre personas, que es lo que se pedía.
2. Proveedor de pago que asuma el riesgo del rastreo. Cuesta y es frágil.
3. Pedir acceso de solo lectura. Ya no es fase de venta.

Señales: existen los perfiles · seguidores · fecha del último post · nº de posts en 90 días ·
interacción media frente a seguidores · si la web enlaza a perfiles vivos o muertos.

Hallazgo que aparece casi siempre: *"LinkedIn sin publicar desde marzo"*. Y el que más
incomoda: *"3.000 seguidores y once likes de media"*, que es audiencia comprada o muerta.

### 01 · Dirección y estrategia

No se observa directamente: se **infiere de la incoherencia entre los otros siete**.

La señal de que hay estrategia es que la web, los anuncios y el social cuenten lo mismo. La
señal de que no la hay es que cuenten tres cosas distintas — y eso sí se mide: se comparan
las propuestas de valor detectadas en cada canal.

Es, deliberadamente, el módulo que se rellena el último y con lo que han dicho los demás.

---

## 4. Arquitectura: tres capas

La separación importa, porque en una reunión de ventas hay que poder defender cada número.

```
1. RECOLECCIÓN   determinista, sin IA
                 crawlers, APIs, DNS, detección de píxeles
                 → Señal { qué, valor, fuente, url, fecha }

2. INTERPRETACIÓN   con IA
                    convierte señales en hallazgos
                    → Hallazgo { qué, gravedad, evidencia[], función que lo arregla }

3. COMPOSICIÓN   determinista + IA
                 puntuación, prioridades, reparto propuesto, documento
```

**Regla, la misma que en el Brand Kit: la IA no genera hechos, solo los interpreta.** Toda
señal lleva su fuente y su fecha. "Tu LCP móvil es de 4,8 s, medido con datos de campo de
CrUX el 22 de septiembre" se sostiene delante de su agencia actual. "Tu web es lenta" no.

Un módulo es una función con esta forma:

```ts
type Modulo = {
  funcion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  recolectar: (ctx: ContextoAuditoria) => Promise<Señal[]>;
  interpretar: (señales: Señal[], ctx: ContextoAuditoria) => Promise<Hallazgo[]>;
  puntuar: (señales: Señal[], hallazgos: Hallazgo[]) => number;   // 0-100
};
```

`ContextoAuditoria` se construye una sola vez (el rastreo, las capturas, el DNS) y lo
comparten los ocho. Correr los ocho no cuesta ocho rastreos.

---

## 5. Herramientas y coste

| Herramienta | Para qué | Coste | Acceso |
| --- | --- | --- | --- |
| **Firecrawl** | Rastreo, markdown, identidad visual | Céntimos por auditoría | Ya integrado |
| **Meta Ad Library API** | Anuncios activos del prospecto | Gratis | App de Meta + token. **Verificar si pide identidad** |
| **PageSpeed Insights API** | Lighthouse: rendimiento, accesibilidad, SEO | Gratis | Clave de Google Cloud |
| **CrUX API** | Core Web Vitals de usuarios reales | Gratis | Misma clave |
| **DNS** | SPF, DKIM, DMARC | Gratis | Ninguno |
| **Claude** | Interpretación y redacción | ~0,30 $ por auditoría | Ya integrado |
| **Centro de Transparencia de Google Ads** | Anuncios de búsqueda y YouTube | Gratis | Sin API pública: navegador |
| Ahrefs o Semrush API | Backlinks, autoridad, keywords | ~100–500 €/mes | Opcional, fase 2 |
| Proveedor de social | Instagram y LinkedIn | ~50–200 €/mes | Opcional, o manual |

**Coste marginal de una auditoría completa: por debajo de 1 €.** Todo lo que de verdad
sostiene el diagnóstico es gratis y oficial. Lo de pago es lo prescindible.

Solo hay un trámite con plazo: la app de Meta. Y es **la misma app** que ya hace falta para
crear campañas en Valme OS, así que no es trabajo nuevo — es un permiso más en una solicitud
que ya vais a hacer.

---

## 6. De la puntuación a la propuesta

```
Nota global = Σ (nota_función × peso_función)
```

Pero la nota global es lo de menos. Lo que se vende es el **reparto**:

```
                      Por defecto    Para vosotros
Dirección y estrategia     9 %    →      12 %   incoherencia entre los tres canales
Paid media                15 %    →      18 %   píxel sin eventos, todo a la home
SEO, contenido y GEO      16 %    →      20 %   sin blog desde 2025, invisible en IA
Social orgánico           15 %    →       8 %   LinkedIn funciona: no lo tocamos
Creatividad y vídeo       15 %    →      15 %
Mensaje y copy             5 %    →       9 %   no os distinguís de tres competidores
Web, landings y CRO       13 %    →      13 %
Datos, CRM y leads        12 %    →       5 %   HubSpot bien montado
```

Fíjate en las bajadas. **Un reparto donde todo sube no es un diagnóstico, es un
presupuesto.** Bajar el peso de lo que ya funciona es lo que hace creíble subir el de lo que
no, y es exactamente lo que dice el one-pager: se ajusta el peso, no la cobertura.

---

## 7. El documento

Ocho páginas, en este orden:

1. **Una página, tres números.** Nota global, las dos cosas que más dinero cuestan, y
   cuánto tardan en contestar un formulario.
2. **Las ocho funciones**, una línea cada una, con semáforo.
3. **Los cinco hallazgos que importan**, con captura, dato y fuente.
4. **Comparativa con tres competidores.** La misma auditoría sobre tres rivales suyos.
   Convierte el documento de "tenéis problemas" en "aquí estáis frente a ellos", que se
   lee entero y se reenvía al jefe.
5. **Su presencia en respuestas de IA**, literal, con capturas de las respuestas.
6. **El reparto propuesto**, con sus subidas y sus bajadas.
7. **Plan a 90 días.** El one-pager ya promete esto: *"en tres semanas tienes plan a 90
   días"*.
8. Qué necesitamos ver para afinarlo: Analytics, Ads, CRM. Que es la petición de accesos,
   colocada al final y ya justificada.

---

## 8. Tres cosas que no estaban en la lista

**El tiempo de respuesta.** No es un módulo, es el titular. De todo lo que se puede medir
desde fuera, es lo único que el prospecto no puede rebatir ni justificar.

**La comparativa con competidores.** Cuesta tres veces lo mismo (menos de 3 €) y cambia lo
que es el documento. Una auditoría se archiva; una comparativa se enseña.

**El test de GEO.** Está en la función que más peso tiene (16 %), casi nadie lo mide, y se
demuestra con una captura de pantalla que se entiende sin explicación.

---

## 9. Cómo lo construimos

**Primero la rúbrica, después el software.** En ese orden, y no es por prudencia.

> **Semana 1 — La rúbrica en papel.** Una hoja con las ocho funciones, las señales concretas
> a comprobar y cómo se puntúa cada una. Sin código.
>
> **Semana 2 — Cinco auditorías a mano.** Cinco prospectos reales, cronometradas. Tardaréis
> entre 60 y 90 minutos cada una. Al terminar sabréis qué señales predicen de verdad una
> conversación y cuáles rellenan hueco.
>
> **Semana 3–4 — Automatizar la recolección.** Solo lo que sobrevivió a la semana 2.
> Firecrawl, Ad Library, PSI, CrUX y DNS son el 80 % del tiempo manual y el 100 % del que
> se automatiza bien. Objetivo: de 90 minutos a 5.
>
> **Semana 5–6 — Interpretación y documento.** La capa de IA y el PDF.

La razón de este orden: si se automatiza primero, se automatiza una lista que nadie ha
validado, y se acaba con una herramienta que produce cuarenta hallazgos de los que solo tres
abren una conversación. La semana 2 es la que dice cuáles son esos tres.

Y hay un beneficio inmediato: **la semana 1 ya se puede vender.** No hace falta esperar a
que exista la app para estandarizar cómo audita el equipo, que es lo que pedías.

---

## 10. Límites y qué no vamos a hacer

- **Nada de rastrear Instagram o LinkedIn contra sus términos.** O manual, o un proveedor
  que asuma el riesgo, o no se hace.
- **El test de respuesta, uno a uno y con datos reales.** Nunca automatizado en masa. Es la
  diferencia entre una prueba de circuito y enviar spam.
- **Solo datos de empresa.** Nada de recopilar perfiles de empleados con nombre: eso ya son
  datos personales y cambia el marco legal.
- **Ningún número sin fuente.** Si una señal no se puede citar con URL y fecha, no entra en
  el documento.
- **No prometemos el "cuánto".** Sin sus accesos no sabemos su CPL ni su conversión, y
  decirlo es más fuerte que insinuar que lo sabemos.
