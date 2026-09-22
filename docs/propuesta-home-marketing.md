# Propuesta de home — Valme como departamento de marketing

Estado: **implementado** en la rama `claude/marketing-homepage-value-prop-4ddfc7`, sin commit.
Este documento refleja lo que hay en el código.
Base: one-pager `equipo-marketing-one-pager.pdf` + home actual (`src/content/seed.ts`).

---

## 1. El giro, en una frase

Hoy la home vende **transformación operativa con IA** (CRM, automatización, control). Es
horizontal y abstracto: compite contra consultoras e integradores, y el visitante tiene que
traducir solo qué le vas a hacer.

La propuesta la reenfoca a **operativa de marketing**. Mismo ADN —diagnosticar, montar,
operar, medir— pero aplicado a un objeto que el cliente ya sabe que necesita y ya sabe que
no tiene resuelto.

Lo que **sobrevive** de la web actual no es el titular, es el diferencial:

| Concepto actual | Qué pasa a significar |
| --- | --- |
| Operativa | Marketing como departamento que opera cada semana, no como campañas sueltas |
| Visibilidad de datos | Un panel con gasto, leads y coste por lead. No un PDF de 40 páginas |
| Control | Un plan a 90 días con números y un reparto de peso que se revisa cada mes |
| Sin ampliar plantilla | Ocho funciones sin ocho contratos, ocho nóminas ni ocho procesos de selección |

Y lo que se añade de nuevo:

- **Equipo holístico** — las ocho funciones siempre activas. Se ajusta el peso, no la cobertura.
- **Expertise detallada** — cada función la lleva quien sabe de esa función.
- **Marketing fácil, no difícil** — la dificultad la absorbemos nosotros. Tú tienes un
  interlocutor, un contrato y un panel.

### El titular

Propuesto:

> **Hacer buen marketing es difícil.**
> **Tenerlo, no.**

Es el "fácil, no difícil" en dos líneas, encaja con el `titleLine1` / `titleLine2` del
componente `Hero` (la segunda línea va en acento) y abre directamente la sección de las ocho
funciones, que empieza justificando por qué es difícil. La línea del one-pager
("Tu departamento de marketing. Sin necesidad de montarlo.") se conserva como subtítulo, así
que la web y el collateral outbound siguen diciendo lo mismo.

---

## 2. Nueva arquitectura de la home

El orden cambia. Los componentes, casi nada: casi todo es contenido nuevo dentro de
componentes que ya existen.

| # | Sección | Componente | Estado |
| --- | --- | --- | --- |
| 1 | Hero | `Hero` | Copy nuevo |
| 2 | Las ocho funciones | **`Functions` (nuevo)** | Rejilla de 8 + barra de reparto. Sin página por función |
| 3 | No es una agencia | `Mission` | Copy nuevo |
| 4 | Señales | `FeatureTabs` | Copy nuevo |
| 5 | Casos | `Cases` | Reubicado + intro nueva (ver riesgo §4) |
| 6 | Cómo entramos | `Services` | Copy nuevo |
| 7 | Montarlo tú vs. con nosotros | `CareersCallout` | Copy nuevo — encaja exacto con la tabla del one-pager |
| 8 | Dos formas de empezar | `Mandates` | Copy nuevo |
| 9 | Contacto | `CTABlocks` | Copy nuevo |

Narrativa: promesa → qué es (y por qué es difícil) → por qué un departamento y no una agencia
→ te reconoces → a otros les pasó y se arregló → cómo entramos → por qué no lo montas tú →
por dónde empiezas → hablamos.

Dos encajes que salen redondos con los componentes que ya tienes:

- **`CareersCallout`** es un panel oscuro a la izquierda y dos columnas a la derecha, una con
  iconos de X y otra con iconos de check. Es exactamente la tabla "SI LO MONTAS TÚ / CON
  NOSOTROS" del one-pager. Cero trabajo de componente.
- **`Mandates`** son dos tarjetas (clara y oscura) con pitch, lista de incluidos y CTA. Es
  exactamente los dos puntos de entrada del pie del one-pager ("si ya tienes operativa" /
  "si empiezas de cero").

---

## 3. Copy sección a sección

Todo lo de abajo va tal cual a `src/content/seed.ts` (y a los mismos campos en Sanity).

### 1 · Hero

```
eyebrow      Departamento de marketing · Pymes B2B
titleLine1   Hacer buen marketing es difícil.
titleLine2   Tenerlo, no.
subtitle     Tu departamento de marketing 360, montado y operando dentro de tu empresa.
paragraph    Son ocho funciones las que tienen que estar activas para que el marketing
             funcione. Montarlas por tu cuenta son ocho procesos de selección, ocho nóminas
             y meses de prueba y error. Con nosotros es un contrato de servicios, un solo
             interlocutor y un equipo que ya está montado y ya ha trabajado junto.
             Operativo en tres semanas.
primaryCta   Hablemos 30 minutos        (whatsapp)
secondaryCta Ver las ocho funciones     (section → intervencion)
```

### 2 · Las ocho funciones

```
eyebrow        / Qué cubre
heading.lead   Ocho funciones.
heading.dim    Ninguna es opcional.
intro          El marketing no falla por hacer una cosa mal: falla por dejar siete sin
               hacer. Estas ocho están siempre activas en tu cuenta. Lo que se ajusta cada
               mes es el peso de cada una, no la cobertura.
```

Las ocho tarjetas (texto literal del one-pager, ya está afinado). **No llevan página propia:**
son tarjetas de la home y nada más.

| # | Función | Tagline |
| --- | --- | --- |
| 01 | Dirección y estrategia | Sin un plan con números, cada mes se decide por intuición y no se aprende nada. |
| 02 | Paid media | Una cuenta mal montada quema presupuesto rápido y en silencio. |
| 03 | SEO, contenido y GEO | Es lo único que sigue trayendo clientes cuando dejas de pagar. Tarda meses: empieza ya. |
| 04 | Social orgánico | Casi todos te investigan antes de escribirte. Un perfil muerto cuesta oportunidades. |
| 05 | Creatividad, diseño y vídeo | La creatividad decide más el resultado de una campaña que la segmentación. |
| 06 | Mensaje y copy | Si no dices por qué tú y no otro, da igual cuánto tráfico traigas. |
| 07 | Web, landings y CRO | Duplicar la conversión vale lo mismo que duplicar el presupuesto, y cuesta mucho menos. |
| 08 | Datos, CRM y leads | Se pierde más dinero tratando mal los leads que optimizando campañas. Responder tarde mata la venta. |

**Barra de reparto de peso** (componente nuevo, pequeño). Es el activo visual que hace
tangible el "equipo holístico" y de paso es el primer golpe de "visibilidad y control":

```
título    Las ocho están siempre activas. Se ajusta el peso, no la cobertura.
nota      Reparto por defecto · se revisa cada mes

Dirección y estrategia      9%
Paid media                 15%
SEO, contenido y GEO       16%
Social orgánico            15%
Creatividad y vídeo        15%
Mensaje y copy              5%
Web, landings y CRO        13%
Datos, CRM y leads         12%
```

Cierre de sección (campos `closing*` que ya existen en `Areas`):

```
closingEyebrow   / Y lo ves
closingHeading   Cada mes ves qué se hizo, qué costó y qué entró. En un panel, no en un
                 PDF de 40 páginas.
closingCta       Hablemos 30 minutos
```

### 3 · No es una agencia

```
eyebrow        / Qué somos
heading.lead   No es una agencia.
heading.dim    Es tu departamento de marketing.
lead           Una agencia te entrega campañas y un informe. Un departamento opera: decide,
               ejecuta, mide y corrige cada semana, con las mismas personas, con nombre y
               cara, en tus reuniones y en tu chat. Eso es lo que montamos dentro de tu
               empresa, sin la maquinaria de montarlo ni de sostenerlo.

principlesEyebrow   / Cómo lo hacemos
```

```
01  Holístico
    Las ocho funciones activas desde el primer mes. No elegimos tres y dejamos el resto
    para más adelante: el marketing solo funciona completo.

02  Expertise por función
    Cada función la lleva quien sabe de esa función. No un generalista que hace de todo a
    medias ni alguien aprendiendo con tu presupuesto.

03  Operativa, no campañas
    Un calendario, un proceso y un ritmo. Lo que hoy se decide en un grupo de WhatsApp pasa
    a ser un sistema que funciona sin ti.

04  Control y datos
    Un panel con lo que se ha gastado, lo que ha entrado y cuánto te cuesta cada lead.
    Decides con números, no con la sensación de que algo se mueve.
```

Estos cuatro principios son la traducción literal de lo que pediste: operativa, equipo
holístico, expertise detallada y control de datos.

### 4 · Señales (`FeatureTabs`)

```
eyebrow        / ¿Te suena esto?
heading.lead   Señales de que tu marketing
heading.dim    no es un departamento todavía.
```

**1 · Marketing sin dueño**
- *statement*: Nadie lleva el marketing. Lo lleváis todos un rato.
- *detail*: Una parte la hace el comercial, otra un diseñador freelance, otra tú un domingo. Nadie tiene la foto completa ni responde de los resultados.
- *solution*: Pasa a haber un responsable y un equipo detrás, con un plan mensual y un número al que rendir cuentas. Tú dejas de ser el director de marketing por defecto.

**2 · Campañas sueltas**
- *statement*: Haces cosas de marketing, pero no tienes marketing.
- *detail*: Un mes anuncios, otro un vídeo, otro rehacer la web. Cada acción empieza de cero y ninguna se apoya en la anterior, así que nada compone.
- *solution*: Montamos una operativa con las ocho funciones activas y un calendario que se cumple. Cada mes construye sobre el anterior en lugar de sustituirlo.

**3 · Presupuesto a ciegas**
- *statement*: Inviertes cada mes y no sabes qué te devuelve.
- *detail*: El informe habla de impresiones y alcance. Lo que no aparece por ningún sitio es cuántas oportunidades reales entraron y a qué coste.
- *solution*: Conectamos campañas, web y CRM en un panel único: gasto, leads, coste por lead y qué canal trae los que acaban comprando.

**4 · Leads que se enfrían**
- *statement*: Entran contactos, pero nadie los atiende a tiempo.
- *detail*: El formulario llega a un correo que se mira cuando se puede. Para cuando alguien responde, el cliente ya está hablando con otro.
- *solution*: Montamos el circuito completo: el lead entra, se cualifica, se asigna y se persigue solo. Y se mide qué pasa con cada uno.

**5 · Contratar da vértigo**
- *statement*: Montar el equipo en fijo son ocho contratos y meses de riesgo.
- *detail*: Ocho funciones son ocho procesos de selección: redactar, filtrar, entrevistar y decidir. Normalmente, tú. Y si un perfil no encaja, has perdido meses de salario.
- *solution*: El equipo ya está montado y ya ha trabajado junto. Si un perfil no encaja, lo cambiamos nosotros. Subes o bajas el equipo con un mes de aviso.

### 5 · Casos

```
eyebrow        / Casos
heading.lead   Así trabajamos
heading.dim    cuando entramos en una empresa.
intro          Tres intervenciones en pymes B2B. Cambia el terreno —una operación
               deportiva, un departamento de ventas, un rol crítico— pero el método es el
               mismo que aplicamos a tu marketing: entender el problema real, construir el
               sistema y quedarnos hasta que el equipo lo usa solo.
cta            Hablemos 30 minutos
```

Los tres casos actuales se mantienen sin tocar. Ver el riesgo en §4.

### 6 · Cómo trabajamos (`Services`)

```
eyebrow        / Cómo trabajamos
heading.lead   De la primera llamada
heading.dim    a un departamento operando.
lead           Cuatro fases que van del diagnóstico a una operativa que se revisa con datos
               cada mes. Lo llamamos
leadMono       The Valme Mandate
```

```
01  Diagnóstico
    Auditamos lo que ya tienes: cuentas de paid, web, medición, CRM y contenido. Sale un
    mapa de qué está montado, qué está roto y qué no existe.

02  Estrategia
    De ahí sale el plan a 90 días: mensaje, canales, reparto de peso entre las ocho
    funciones y los números a los que vamos. Con fechas.

03  Construcción y adopción
    Montamos lo que falte —web, medición, circuito de leads— y el equipo entra en tus
    reuniones y en tu chat hasta que operar así es lo normal.

04  Medición
    Revisión mensual con los datos delante: qué funcionó, qué no y cómo se reparte el peso
    el mes siguiente. El marketing deja de decidirse por intuición.
```

### 7 · Montarlo tú vs. con nosotros (`CareersCallout`)

```
eyebrow   / Por qué así
heading   Hacer buen marketing es difícil. Y montar el equipo que lo ejecute, también.
intro     No es que no sepas lo que hay que hacer. Es que montarlo por dentro son ocho
          contrataciones, ocho relaciones laborales y todo el riesgo de acertar a la
          primera. Esa parte ya la hicimos nosotros.
```

| Si lo montas tú (iconos X) | Con nosotros (iconos check) |
| --- | --- |
| Ocho funciones son ocho procesos de selección: redactar, filtrar, entrevistar y decidir. Normalmente, tú. | Esa parte ya la hicimos: el equipo está montado, ya ha trabajado junto y es operativo en tres semanas. |
| Cada contratación es una relación laboral: nóminas, periodo de prueba, formación, vacaciones, bajas y rotación. | Un contrato de servicios y un solo interlocutor. Sin nóminas y sin gestión de personal. |
| Y no se acierta a la primera: un perfil que no encaja cuesta meses de salario y volver a empezar. | Si un perfil no encaja, lo cambiamos nosotros. El riesgo de acertar es nuestro, no tuyo. |
| Y el día que haya que reducir el equipo, es un despido. | Subes o bajas el equipo cuando lo necesites, con un mes de aviso. |

### 8 · Dos formas de empezar (`Mandates`)

```
eyebrow        / Por dónde empezar
heading.lead   Dos puntos de partida.
heading.dim    Según lo que ya tengas montado.
lead           El primer paso no es el mismo si ya tienes cuentas y web funcionando que si
               empiezas de cero. En los dos casos sales de la primera conversación sabiendo
               qué se hace y cuándo.
footnote       Un contrato de servicios, no una relación laboral. Sin nóminas, sin gestión
               de personal y sin permanencia larga: un mes de aviso.
```

**M/01 — Si ya tienes operativa** *(tarjeta clara)*
> Ya inviertes en marketing: tienes cuentas montadas, web y algo de medición. El problema no
> es empezar, es que nadie lo está dirigiendo entero.

- Auditoría de cuentas, web, medición y CRM
- Mapa de qué está montado, roto o sin hacer
- Plan a 90 días con números y fechas
- En tres semanas tienes el plan y el equipo dentro

CTA: `Quiero la auditoría`

**M/02 — Si empiezas de cero** *(tarjeta oscura)*
> No hay nada montado, o lo que hay no sirve. Construimos la base entera —mensaje, web,
> medición y circuito de leads— y a partir de ahí se capta.

- Mensaje y propuesta de valor
- Web y landings que convierten
- Medición y CRM desde el primer día
- Circuito de leads completo
- Captando en ocho semanas

CTA: `Quiero empezar`

### 9 · Contacto

```
eyebrow     / El primer paso
heading     Hablemos 30 minutos.
paragraph   Nos cuentas cómo está tu marketing hoy y te decimos qué falta, qué sobra y por
            dónde empezaríamos. Sin presentación de agencia y sin compromiso.
cta         Hablemos 30 minutos
footnote    Respondemos en menos de 24 horas laborables.
```

### Navegación, SEO y ajustes de marca

```
descriptor        Tu departamento de marketing
navCtaLabel       Hablemos 30 minutos
whatsappMessage   Hola, me gustaría hablar 30 minutos sobre el marketing de mi empresa.

navLinks          Qué cubre          → intervencion
                  Cómo funciona      → tesis
                  Casos              → casos
                  Por dónde empezar  → (sección Mandates)
                  Contacto           → contacto

seo.title         Valme Solutions | Tu departamento de marketing, sin montarlo
seo.description   Un equipo de marketing 360 que se integra en tu pyme B2B: estrategia,
                  paid, SEO, contenido, creatividad, web y datos. Las ocho funciones
                  activas, un solo contrato. Operativo en tres semanas.

footerLegal       Valme Solutions — Tu departamento de marketing, sin necesidad de montarlo.
                  Ocho funciones siempre activas, un solo contrato y un solo interlocutor.
```

---

## 4. Los casos

Los tres casos son ahora de marketing, que era el punto que sostenía o hundía esta
página:

| # | Caso | slug |
| --- | --- | --- |
| 01 | Un CEO sin control ni visibilidad sobre su marketing | `ceo-sin-visibilidad-marketing` |
| 02 | Optimizaban el canal equivocado; se midió hasta el cierre y se movió el presupuesto | `atribucion-canal-rentable` |
| 03 | Arranque desde cero con paid reforzado con SEO | `paid-con-seo-desde-cero` |

Cada uno conserva su imagen, que hace doble función: tarjeta en la home y cabecera de
la ficha. Se quitaron las galerías interiores porque las que había eran capturas de la
aplicación de un club de tenis y de una empresa de publicidad exterior: puestas bajo un
caso de marketing estarían atribuyendo un trabajo que no es ese. `CaseImageBand` hace
`return null` sin imagen, así que las fichas se quedan sin esas bandas y ya está.

Siguen siendo **ilustrativos**, igual que los anteriores y con la misma convención: sector
y tamaño, sin nombres y sin afirmar por escrito que sean reales. Se sustituyen por clientes
reales en cuanto los haya.

---

## 5. Decisiones tomadas

1. **Páginas por función: no.** Las ocho funciones son tarjetas de la home y nada más. Eso
   quita de en medio ocho landings por escribir y, sobre todo, evita tocar la colección de
   áreas: no hay rutas nuevas, ni sitemap que actualizar, ni riesgo de romper lo indexado.

2. **Las cuatro áreas de operaciones: intactas.** Salen de la home, pero las cuatro páginas
   `/areas/*` siguen publicadas y enlazadas desde el footer como segunda línea. Cero cambios
   en esa colección.

3. **Valme Brain: fuera** de la home. Una home que vende una cosa convierte.

4. **Precio: no se enseña.** El bloque "dos formas de empezar" habla de contrato de servicios
   y de un mes de aviso, sin cifras.

5. **El ciclo se queda.** Diagnóstico → Estrategia → Construcción y adopción → Medición, en
   la sección "Cómo trabajamos" (`Services`), la del layout escalonado con imágenes. Vive solo
   ahí: `Mission` pasa a los cuatro principios nuevos, así que se deshace la duplicación que
   había entre las dos secciones.

6. **"The Valme Mandate"** se mantiene como nombre del método.

---

## 6. Plan de implementación

**El seed es lo que se publica.** `useSanity` exige `NEXT_PUBLIC_USE_SANITY=1` además del
project id, y hoy no está activo: `src/content/seed.ts` es la fuente real del sitio, en local
y en producción. Ahí va el trabajo. El esquema de Sanity se actualiza en paralelo para no
romper la migración, pero no es lo que sirve la web.

### A · Contenido — `src/content/seed.ts`

Es el grueso del trabajo. Todo el copy de §3.

| Campo | Cambio |
| --- | --- |
| `hero` | Copy nuevo |
| `functions` | **Nuevo**: eyebrow, heading, intro, `items[8]`, barra de reparto, bloque de cierre |
| `areasSection` | Se elimina (lo sustituye `functions`) |
| `mission` | Heading y lead nuevos; `principles` → los cuatro pilares |
| `symptoms` | Cinco señales nuevas |
| `casesSection` | Heading e intro nuevos (los tres casos no se tocan) |
| `methodology` | Heading nuevo; `steps` → Diagnóstico / Estrategia / Construcción y adopción / Medición |
| `mandates` | Los dos puntos de entrada; footnote sin precio |
| `admission` | Pasa a ser la tabla montarlo-tú / con-nosotros |
| `contact` | Copy nuevo |
| `seo` | Título y descripción nuevos |
| `settingsSeed` | `descriptor`, `navLinks`, `navCtaLabel`, `whatsappMessage`, `footerLegal`, `footerColumns` |

### B · Componente nuevo — `src/components/Functions.tsx`

Único componente nuevo. Reutiliza la gramática visual de `Areas.tsx`, que ya funciona:
eyebrow mono, `SplitReveal` con lead y `dim` en gris, intro, imagen ancha, rejilla `gap-px`
con la línea de acento que crece en hover e índice mono `/01`.

Diferencias:

- Ocho tarjetas **sin `<Link>`** (son `div`, no navegan a ningún sitio).
- Rejilla `sm:grid-cols-2 lg:grid-cols-4` → dos filas de cuatro, como el one-pager.
- Debajo, la **barra de reparto**: ocho segmentos proporcionales en degradado del acento y
  leyenda con los porcentajes. En móvil la barra se mantiene y la leyenda pasa a dos columnas.
- Bloque de cierre con los campos `closing*`, igual que `Areas`.
- `id="funciones"` (libre: hoy nadie enlaza a `#intervencion`).

### C · Orden — `src/app/HomeView.tsx`

```
Hero → Functions → Mission → FeatureTabs → Cases → Services → CareersCallout → Mandates → CTABlocks
```

Tres movimientos: `Areas` se convierte en `Functions` y sube al segundo puesto, `Cases` baja
al quinto, y `CareersCallout` y `Mandates` intercambian posición.

### D · Sanity (en paralelo, no bloquea)

- `studio-valme/schemaTypes/documents/homePage.ts`: el objeto `areasSection` pasa a
  `functions`, con `items[]` y `weights[]`.
- `studio-valme/seed.ts`: mismo copy que el seed local.
- `src/sanity/queries.ts`: la proyección `"areas"` sale de `HOME_QUERY` (las páginas de área
  siguen usando `AREA_QUERY` y `AREA_SLUGS_QUERY`, que no se tocan).

### E · Lo que no se toca

- Las cuatro áreas de operaciones y sus páginas `/areas/*`.
- Los tres casos y sus páginas `/casos/*`.
- `Areas.tsx` se queda en el repo sin usar, como ya pasa con `Firm.tsx` y `UseCases.tsx`, por
  si algún día volvéis a poner las áreas en la home.
