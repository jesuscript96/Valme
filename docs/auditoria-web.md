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

---

## 9. Estilos, stack, herramientas e imágenes

Todo eso se puede, y tres de las cuatro cosas valen mucho. Pero **no las metería como
apartados nuevos**: si el informe crece a nueve categorías vuelve a ser una lista técnica y
se pierde lo que lo hacía legible. Cada una entra en el paso del embudo donde hace daño.

### Imágenes · paso 1

**Lo primero que construiría de esta tanda.** Es lo más medible, casi siempre está mal, y
suele ser la causa directa del problema de velocidad que ya vas a señalar.

Todo sale de la misma carga de página, sin herramientas nuevas:

| Qué se mide | Cómo | Por qué importa |
| --- | --- | --- |
| Peso total de imágenes y cuántas son | Cabeceras de las peticiones | El titular: «vuestra home pesa 8,4 MB y 7,1 MB son imágenes» |
| Formato: JPEG y PNG frente a WebP y AVIF | Tipo de contenido | Convertir suele quitar el 60 % del peso sin tocar nada más |
| Tamaño servido frente al mostrado | `naturalWidth` frente a `clientWidth` | Una foto de 4000 px en un hueco de 380 px es el desperdicio más común |
| Peso de la imagen del hero | Es casi siempre el elemento del LCP | Conecta con el dato de campo: explica el porqué del número |
| `loading="lazy"` por debajo del pliegue | Atributo | Gratis y nadie lo pone |
| `width` y `height` declarados | Atributos | Su ausencia es la causa habitual del CLS |
| Texto alternativo | Atributo | Accesibilidad y SEO a la vez |
| Propias o de banco de imágenes | Modelo con visión | Las de banco cuestan confianza en B2B |

El hallazgo se escribe solo y se puede cuantificar sin inventar nada: peso actual, peso
estimado tras convertir y redimensionar, y qué imagen concreta es la culpable.

### Estilos · pasos 2 y 3

Aquí la clave es **qué se cuenta**. «Usan azul y una tipografía sans» no es un hallazgo. Lo
que sí lo es:

> Cuántos valores distintos hay de cada cosa.

Se recorren los estilos aplicados de la página y se cuentan colores únicos, familias
tipográficas, tamaños de letra, radios de borde y sombras. Una web con catorce tamaños de
letra y cuarenta grises **no tiene sistema de diseño**: tiene decisiones acumuladas de gente
distinta a lo largo de los años. Y eso significa que cualquier cosa nueva que se añada va a
desentonar, lo cual es exactamente el problema que resuelve lo que vendemos.

Además:

- **Coherencia entre páginas.** ¿La página de servicio se parece a la home, o parece de otra
  empresa? Se compara la paleta y la tipografía de las cuatro páginas auditadas.
- **Coherencia entre el anuncio y la landing.** Esta es la buena, y hay que cruzarla con la
  herramienta de Paid: si el anuncio es naranja y desenfadado y la landing es azul marino y
  corporativa, el clic rebota. Es un hallazgo que ninguna de las dos herramientas puede
  producir sola.
- **Tipografías web.** Cuántas familias y pesos se cargan, y de dónde. Si vienen del CDN de
  Google hay un riesgo conocido: una sentencia alemana de 2022 consideró que servirlas desde
  Google sin consentimiento vulnera el RGPD por la transferencia de IP. No es jurisprudencia
  española y no lo presentaría como ilegal, pero es un riesgo real y arreglarlo es alojar el
  fichero. Conviene señalarlo con ese matiz. *Nota: valmesolutions.com las carga así.*

Firecrawl, que ya está integrado, devuelve en su formato `branding` el logo, la paleta, las
tipografías, el espaciado y el estilo de los botones en JSON. Sirve de punto de partida y
ahorra la mitad del trabajo.

### Herramientas · paso 5

El catálogo ya existe en `signatures.ts` y detecta diecisiete. Ampliarlo es añadir entradas.

Pero **un inventario no es un diagnóstico**. Lo que convierte esto en hallazgo son tres
cosas:

**Contradicciones.** Tienen Hotjar instalado desde hace dos años y el formulario sigue con
nueve campos: se paga por mirar y no se actúa. Tienen un CRM cargado y el formulario va a un
`mailto:`. Eso no es una lista, es una historia.

**Huecos.** Hay formulario de newsletter y no hay ninguna herramienta de email. ¿Dónde van
esos correos?

**Redundancia.** Dos analíticas, tres chats, dos gestores de etiquetas. Significa que nadie
es dueño de esto y que cada uno instaló lo suyo.

Lo que **no** haría es estimar lo que pagan. Es tentador y suena muy bien, pero los precios
dependen del plan y no los sabemos. Se enumera lo detectado y se pregunta en la reunión: la
cifra la pone el cliente y entonces sí es suya.

### Stack tecnológico · contexto, no hallazgo

Aquí discrepo un poco. Saber que es WordPress con Elementor, o Webflow, o Shopify, **casi
nunca es un hallazgo por sí mismo**. A nadie le sirve que le digas en qué está hecha su web.

Sirve para otras dos cosas, las dos importantes:

1. **Predice lo que vas a encontrar.** Un Elementor con veinte plugins ya te dice dónde va a
   estar el problema de velocidad antes de medirlo.
2. **Dice qué se puede hacer y a qué coste.** Si es Webflow, podemos tocar las landings
   nosotros. Si es un desarrollo a medida de hace ocho años, cada cambio pasa por su
   programador y eso cambia el plan de 90 días entero.

Por eso va en el bloque de contexto del informe, junto con el sector y el ticket, y no en la
lista de hallazgos. **Sí pasa a ser hallazgo** cuando causa un problema concreto: versiones
sin soporte, sin CDN con un TTFB malo, o un constructor que es demostrablemente el culpable
del LCP.

Se detecta de las cabeceras, las rutas de los recursos y las huellas del HTML. No hace falta
ninguna herramienta externa.

---

## 10. Y lo que no has preguntado

Cuatro más que yo metería, por orden de lo que rinden:

**Cómo se ve al compartir el enlace.** Etiquetas Open Graph: título, descripción e imagen.
Si un comercial pega su URL en LinkedIn y sale un cuadro gris sin texto, eso es una fuga en
el canal donde más se mueve el B2B. Se comprueba en dos líneas y no lo audita nadie.

**Enlaces rotos internos.** Se recorren los enlaces de las cuatro páginas y se comprueba que
respondan. Es vergonzoso, es indiscutible y se arregla en una tarde.

**El sitemap frente a la realidad.** URLs declaradas en el sitemap que devuelven 404 o
redirigen. Señal clarísima de que nadie mantiene el sitio.

**Vídeo incrustado.** Un YouTube empotrado carga cientos de kilobytes y pone cookies antes
de que nadie le dé al play. Hay alternativas con carga diferida que cuestan una hora.

Y una que **no** metería aunque se puede: análisis de seguridad más allá de las cabeceras
básicas. Detectar versiones vulnerables de plugins es fácil y es un campo de minas: o suena
a amenaza, o te comprometes a algo que no vendemos. Las cabeceras sí, porque son higiene y
se explican en una línea.

---

## 11. Si tuviera que elegir

Con todo lo de arriba sobre la mesa, lo que más rinde por hora invertida:

1. **Imágenes.** Medible, casi siempre mal, explica el problema de velocidad y se arregla
   barato.
2. **Formulario campo a campo.** Es donde se pierde el lead.
3. **Contradicciones de herramientas.** Cuenta una historia, y las historias se recuerdan.
4. **Recuento de estilos.** Un número que demuestra que no hay sistema.
5. **Open Graph y enlaces rotos.** Baratos y embarazosos, en el buen sentido.

El stack lo recogería desde el principio porque sale gratis de lo que ya cargas, pero lo
dejaría en el contexto hasta que pruebe que causa algo.
