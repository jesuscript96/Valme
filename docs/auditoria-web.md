# Auditoría Web · el diagnóstico y cómo montarlo

Propuesta a fondo para la herramienta de Web. Cubre las funciones 07 (Web, landings y CRO)
y 08 (Datos, CRM y leads): **el 25 % del reparto**, la herramienta más grande de las tres.

---

## 1. El principio: esto no es una auditoría técnica

Una auditoría web de agencia suele ser una lista de cosas mal ordenadas por categoría:
rendimiento, accesibilidad, SEO técnico. Eso lo saca cualquiera con Lighthouse y no vende
nada, porque el cliente no sabe qué hacer con un 62 sobre 100.

La pregunta que sí importa a quien nos contrata es otra: **¿dónde se pierde el dinero entre
el clic y el lead?**

Por eso el diagnóstico se organiza como un embudo de cinco pasos. Cada paso es un sitio por
donde se fuga gente, y cada hallazgo se cuelga del paso donde ocurre:

```
1. ¿LLEGA?           carga, errores, móvil real
2. ¿ENTIENDE?        qué ve en la primera pantalla
3. ¿CONFÍA?          pruebas, legal, quién hay detrás
4. ¿PUEDE?           fricción, formulario, accesibilidad
5. ¿QUEDA REGISTRO?  medición y circuito del lead
```

Un informe así se lee solo. «Llegan, entienden, confían, y en el paso cuatro tenéis un
formulario de nueve campos sin etiquetas» es una frase que cierra reuniones. «Accesibilidad:
71/100» no.

---

## 2. Los cinco pasos, uno a uno

### Paso 1 · ¿Llega?

**Datos de campo, no de laboratorio.** Esta es la diferencia entre un informe que se discute
y uno que no. La API de CrUX da el percentil 75 de usuarios reales de los últimos 28 días,
separado por móvil y escritorio.

| Métrica | Bueno | Mejorable | Malo | Qué es |
| --- | --- | --- | --- | --- |
| LCP | ≤ 2,5 s | 2,5–4,0 s | > 4,0 s | Cuándo aparece lo importante |
| INP | ≤ 200 ms | 200–500 ms | > 500 ms | Cuánto tarda en responder al tocar |
| CLS | ≤ 0,10 | 0,10–0,25 | > 0,25 | Cuánto baila el contenido al cargar |
| TTFB | ≤ 800 ms | 800–1800 ms | > 1800 ms | Cuánto tarda el servidor en contestar |

Dos detalles que separan un informe serio de uno automático:

- **CrUX responde por URL y por origen.** Por URL suele no haber datos en sitios pequeños
  porque no llegan al mínimo de muestra. La estrategia es pedir la URL, caer al origen si no
  hay, y **decir cuál de los dos se está enseñando**. Presentar datos de origen como si
  fueran de la home es de las cosas que te desmontan en una reunión.
- **La API de historial de CrUX da seis meses.** Un número suelto es una foto; la serie dice
  si van a peor. «Vuestro LCP móvil ha pasado de 2,9 a 4,4 s desde marzo» vale diez veces
  más que «vuestro LCP es 4,4 s».

**Laboratorio, para explicar el porqué.** CrUX dice *cuánto*; Lighthouse dice *por qué*.
De PageSpeed interesan menos las puntuaciones que las auditorías concretas: JavaScript sin
usar, imágenes sin comprimir ni en formato moderno, recursos que bloquean el render,
tipografías que tapan el texto mientras cargan, y el **peso de terceros**.

Ese último es el más rentable en una auditoría de marketing: normalmente una parte grande
del tiempo de carga se la comen el gestor de etiquetas, el chat y los píxeles. Es un
hallazgo que apunta directo a lo que vendemos y se arregla en una tarde.

**Y lo que no sale en ninguna puntuación:** errores de JavaScript al cargar. Un error puede
dejar el formulario muerto sin que se note. Se recogen de la consola.

### Paso 2 · ¿Entiende?

Lo que se ve **sin hacer scroll**, a 375 px de ancho, que es como llega la mayoría del
tráfico de pago.

- ¿Hay una frase que diga a qué se dedican? ¿En cuántas palabras?
- ¿Hay una llamada a la acción visible? ¿Cuántas compiten?
- ¿El H1 dice algo o es el nombre de la empresa?
- ¿Cuánto del primer pantallazo lo ocupa el menú y el aviso de cookies?

Esto se mide con captura a varios anchos y un modelo con visión mirando la primera pantalla.
Es el único sitio de la herramienta donde la IA aporta algo que el código no puede, y se usa
para **describir lo que se ve**, no para puntuar.

### Paso 3 · ¿Confía?

Señales verificables, y si no las hay se dice que no las hay:

- Testimonios con nombre y cara, o genéricos
- Logos de clientes
- Dirección física y teléfono visible
- Páginas legales que existan y carguen: aviso legal, privacidad, condiciones
- Datos de la empresa: CIF, razón social, registro mercantil
- Certificaciones o sellos
- Años de actividad declarados

Falta de páginas legales no es solo confianza: **es incumplimiento**. En España la LSSI
obliga a publicar identificación del prestador. Es un hallazgo que se puede afirmar sin
matices.

### Paso 4 · ¿Puede?

El paso donde más dinero se pierde y el menos mirado.

**El formulario, campo a campo.** No basta con contarlos:

| Qué se mira | Por qué |
| --- | --- |
| Número de campos visibles y cuántos obligatorios | Cada campo de más cuesta envíos |
| ¿Hay `<label>` o solo `placeholder`? | Un placeholder desaparece al escribir y no lo lee un lector de pantalla |
| `type="tel"`, `type="email"` | Cambian el teclado del móvil. No ponerlo es fricción gratuita |
| Atributos `autocomplete` | Dejan que el móvil rellene solo |
| Validación en línea o solo al enviar | Descubrir tres errores de golpe al final es donde se abandona |
| Consentimiento RGPD | Sin él, el lead no se puede usar |
| A dónde va el `action` | Un `mailto:` no es un circuito: no hay registro ni medición |

**Accesibilidad, con axe-core.** Es la biblioteca estándar y es determinista: unas noventa
reglas, sin falsos positivos relevantes. Contraste, etiquetas, texto alternativo, orden de
foco, encabezados, roles.

No detecta todo: lo que depende de contexto necesita ojos humanos. Pero lo que detecta es
indiscutible, y da un gancho comercial que casi nadie usa: **la Ley 11/2023 y la directiva
europea de accesibilidad obligan a determinados servicios digitales**. Hay que comprobar si
el cliente entra en el ámbito, pero cuando entra, esto deja de ser una recomendación.

**Móvil de verdad**, no la ventana redimensionada:

- Tamaño de los objetivos táctiles. WCAG 2.2 exige 24 × 24 px como mínimo legal; 44 px es lo
  que funciona con un dedo.
- ¿Hay scroll horizontal? Es el fallo más delatador de una web no pensada para móvil.
- ¿El teléfono es un enlace `tel:` o texto que hay que copiar?
- ¿El aviso de cookies tapa el contenido y no se puede cerrar?
- ¿Hay CTA fija abajo o hay que volver arriba?

**El camino hasta contactar.** Desde la home, cuántos clics hasta poder dejar los datos. Y
desde donde apunta un anuncio: si un anuncio lleva a la home, el recorrido empieza ya mal.

### Paso 5 · ¿Queda registro?

Lo de la función 08, que ya está medio hecho:

- Inventario de etiquetas confirmado en runtime, con sus identificadores
- **¿GA4 mide eventos o solo visitas?** Se ve en las peticiones a `/g/collect`: el parámetro
  `en=` lleva el nombre del evento. Si solo hay `page_view`, no se está midiendo nada que
  importe.
- Consent Mode: ¿está, y cambia algo al rechazar?
- **El aviso de cookies, ¿bloquea de verdad?** Se comparan las peticiones antes y después de
  rechazar. Muchos no bloquean nada, lo que es un problema legal y además explica por qué
  sus datos no cuadran.
- SPF, DKIM, DMARC y MX
- A dónde va el formulario y si existe página de gracias medible

---

## 3. Las herramientas externas

Todo lo esencial es gratis.

| Herramienta | Qué aporta | Coste | Cómo |
| --- | --- | --- | --- |
| **PageSpeed Insights API** | Lighthouse completo: rendimiento, accesibilidad, buenas prácticas y todas las auditorías con su detalle | Gratis, 25.000 al día | Clave de Google Cloud |
| **CrUX API** | Campo real, p75 a 28 días, por móvil y escritorio | Gratis | La misma clave |
| **CrUX History API** | Seis meses de serie | Gratis | La misma clave |
| **axe-core** | Accesibilidad determinista | Gratis, npm | Se inyecta en la página que ya carga Playwright |
| **sharp** | Peso real de imágenes, formato y tamaño servido frente al mostrado | Gratis, npm | Ya está en el proyecto |

Una sola clave de Google Cloud cubre las tres primeras. Se saca en cinco minutos.

**De pago, y solo si algún día hace falta:** WebPageTest da tira de fotogramas, cascada de
red y dispositivos reales desde varias ubicaciones, por unos céntimos por prueba. Es
espectacular en una reunión y no aporta ningún hallazgo que las gratuitas no den. Lo dejaría
para cuando el resto esté cerrado.

**Lo que NO metería:** Screaming Frog y Sitebulb son de escritorio y no encajan en un
proceso automático. Ahrefs y Semrush son de SEO, no de Web, y son caros.

---

## 4. Qué se audita: no solo la home

Un fallo común es auditar la home y llamarlo auditoría web. La home casi nunca es donde se
convierte.

Cuatro páginas, elegidas solas:

1. **La home.**
2. **Una página de servicio.** Del sitemap, la que más se parezca a lo que venden.
3. **La página de contacto.** Donde está el formulario de verdad.
4. **A donde apunta su publicidad**, si la herramienta de Paid ya lo ha resuelto.

Eso son cuatro cargas de página y ocho llamadas a PageSpeed contando móvil y escritorio.
Entra de sobra en la cuota gratuita.

---

## 5. Lo que hay que cambiar en la arquitectura

Aquí está el trabajo de fondo, y conviene hablarlo con el CTO antes de escribir nada.

**Hoy `recogerRuntime` carga la home una vez y saca las señales base.** La herramienta de
Web necesita de esa misma carga muchas cosas más: axe, capturas a tres anchos, medición de
objetivos táctiles, análisis del formulario, peso de terceros. Y lo necesita en cuatro
páginas, no en una.

Volver a cargar la página por cada cosa sería multiplicar por seis el tiempo. La solución es
que el colector base acepte **añadidos** que corren dentro de la misma sesión:

```ts
export type Añadido = {
  nombre: string;
  /** Corre con la página ya cargada. Devuelve señales. */
  ejecutar: (page: Page, url: string) => Promise<Señal[]>;
};

export async function recogerRuntime(
  url: string,
  opciones?: { añadidos?: Añadido[]; paginas?: string[] },
): Promise<Runtime>;
```

Con eso, la herramienta de Web pasa sus añadidos y todo sale de una carga por página. Las
otras dos herramientas no se enteran.

**Ficheros nuevos**, todos dentro de lo que te pertenece:

```
collect/tools/psi.ts        PageSpeed, CrUX y el historial
collect/tools/axe.ts        accesibilidad, como añadido
collect/tools/viewport.ts   capturas y medidas a 375 / 768 / 1440, como añadido
collect/tools/formulario.ts análisis del formulario campo a campo, como añadido
collect/tools/paginas.ts    elegir las cuatro páginas del sitemap
rules/07-web.ts             tus reglas
rules/08-datos.ts           tus reglas
```

---

## 6. La puntuación

Cada función da de 0 a 100. El modelo que propongo, por ser explicable:

```
100 de partida
  −25 por cada p0
  −12 por cada p1
   −5 por cada p2
   −2 por cada p3
  suelo en 0
```

Con **una condición que importa más que la fórmula**: la nota solo cuenta las
comprobaciones que se han podido hacer. Un sitio sin datos de CrUX no saca cien en
rendimiento: saca «sin datos suficientes», y la cobertura de esa función baja.

Sin eso, el sitio peor medido saca la mejor nota, que es justo lo contrario de lo que
queremos.

---

## 7. La disciplina que hace que esto se pueda defender

Tres reglas, y la primera es la que más tienta romper.

**No inventar porcentajes de mejora.** Es facilísimo escribir «bajando el LCP a 2,5 s
subiríais la conversión un 15 %». No lo sabemos, y en cuanto alguien lo pregunte se cae todo
el informe. Lo que sí se puede decir: «el p75 móvil está en 4,8 s; el umbral de Google para
considerarlo bueno son 2,5 s». Eso es un hecho con su fuente.

**Distinguir hecho, hipótesis y oportunidad.** «El formulario tiene nueve campos» es un
hecho. «Nueve campos están costando envíos» es una hipótesis razonable y se etiqueta como
tal. Las dos valen; mezclarlas, no.

**Lo que no se ha podido comprobar se declara.** Si no hay datos de campo, el informe lo
dice en portada. No haber podido mirar algo no es lo mismo que que esté bien.

---

## 8. Por dónde empezaría

| | Qué | Por qué en este orden |
| --- | --- | --- |
| **1** | Clave de Google Cloud, y `psi.ts` con PageSpeed y CrUX | Es el dato más duro y el que menos depende de nada. Diez reglas salen solas. |
| **2** | Historial de CrUX | La serie de seis meses vale más que el número suelto y es la misma clave. |
| **3** | Los añadidos en el colector base | El cambio de arquitectura. Cuanto antes, menos hay que rehacer. |
| **4** | `formulario.ts` con el análisis campo a campo | Es donde más dinero se pierde y no depende de nada externo. |
| **5** | `axe.ts` | Muchas reglas de golpe, y el gancho legal. |
| **6** | Las cuatro páginas en vez de la home | Cuando lo de arriba funcione sobre una. |
| **7** | `viewport.ts` y la primera pantalla con visión | Lo último: es lo más vistoso y lo menos determinista. |

Con los pasos 1, 2 y 4 ya tienes una herramienta que aguanta una reunión. Lo demás la hace
mejor.
