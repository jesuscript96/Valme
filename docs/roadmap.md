# Roadmap de producto

La herramienta de marketing, por fases. Qué se puede hacer en cada una, dónde está el
corte de MVP y qué queda fuera a propósito.

> **Revisión.** Esta versión corrige la anterior en cuatro cosas: el cliente no entra en la
> aplicación, la parte de cobros sale del alcance, la base de datos es trabajo del CTO y no
> entra aquí, y **los trámites de Meta y Google no son el problema que dije**. Lo de Meta
> está explicado en §5, porque el error cambia el orden de las cosas.

---

## 1. El mapa

Dos one-pagers y dos taxonomías, que conviene no mezclar:

- **Valme Solutions** define cuatro áreas de operaciones. Es el mapa del producto completo.
- **Equipo de marketing** define ocho funciones. Es el trabajo que se entrega.

Las ocho funciones son *lo que se hace*; las cuatro áreas son *cómo se lleva*. Y el método
—diagnóstico, intervención, operación— no es una fase: es la columna que recorre todo.

Este roadmap cubre la herramienta de marketing, que toca tres de las cuatro áreas: Revenue
(captar y vender), Internal (ejecutar) y Executive Intelligence (medir). Administrative
queda fuera por decisión tuya.

---

## 2. Dos decisiones que ya condicionan el diseño

**El cliente no entra en la aplicación.** Eso simplifica bastante: todo lo que vería el
cliente es un documento o un correo que sale de la herramienta, no una pantalla que hay que
diseñar, proteger y mantener. Se gana tiempo en las fases 2, 3 y 4, y se puede abrir más
adelante cuando haya algo que aguante una mirada externa.

**Todo es una herramienta, no una pantalla.** Una entrada, una salida, un botón. Esto no es
cosmético: si cada capacidad tiene su contrato, la capa de conversación —pedirle a un
asistente que lo haga en vez de buscar el botón— se añade después sin rehacer nada, porque
el asistente llama a las mismas herramientas. Con lógica metida dentro de pantallas, esa
capa hay que escribirla otra vez entera.

---

## 3. Dónde estamos

| | |
| --- | --- |
| **Diagnóstico** | Registro de leads y tres auditorías: Paid, SEO y Web. La Web con 51 comprobaciones y el informe por embudo. Funcionando en producción. |
| **Cuentas** | Brand Kit, ofertas, estudio de anuncios, landings, leads e integraciones. Recorrible con datos de demo. |
| **Base** | Login, ámbito por cliente y contabilidad de coste de IA. |

---

## 4. Las fases

El orden sigue el ciclo de vida de un cliente. Eso hace la cobertura horizontal por
construcción: al terminar la fase 3 se puede llevar a alguien del primer contacto hasta el
trabajo entregado, aunque cada paso sea básico.

### Fase 1 · Captar y diagnosticar

Entra un lead y, con su dominio, sale un informe que se lleva a una reunión.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Formulario de captación** | — | Un lead en el sistema. *Hoy la web no lo tiene: no puede entrar nada* |
| **Diagnóstico completo** | Dominio | Las tres auditorías en una pasada |
| **Comparativa con competidores** | Dominio + 3 rivales | El mismo informe sobre los cuatro, en una tabla |
| **Informe para el cliente** | Una auditoría | PDF con portada, hallazgos y plan a 90 días |
| **Aviso de lead nuevo** | — | Correo o WhatsApp al comercial |

**Corte:** el informe es un PDF generado, no un editor. Se descarga y se envía a mano.

**Fuera:** puntuación automática del lead, secuencias de seguimiento.

> La comparativa es lo que más cambia la conversación. Una auditoría se archiva; una
> comparativa se enseña y se reenvía al jefe.

### Fase 2 · Vender

De la auditoría sale la propuesta, y de la propuesta el cliente.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Generador de propuesta** | Una auditoría | Propuesta con el reparto de las ocho funciones ajustado a los hallazgos |
| **Calculadora de alcance** | Recursos y meses | Precio, con el modelo de 2.500 € por recurso |
| **Propuesta como página** | Propuesta | Enlace propio que avisa cuando la abren y en qué apartado se paran |
| **Convertir lead en cliente** | Lead ganado | Cliente creado, con la auditoría como línea base y el Brand Kit medio sembrado |

**Corte:** el pipeline son cinco estados en una columna, no un CRM. Sin previsiones ni
ponderaciones. La firma, con un proveedor externo o a mano.

**Fuera:** CRM completo, informes comerciales.

> La propuesta como página y no como PDF es lo que convierte esta fase en producto: saber
> cuándo la han abierto y dónde se han parado es información de venta que hoy no tenéis.
> Y el reparto ajustado tiene que llevar **bajadas**, no solo subidas: si todo sube no es
> un diagnóstico, es un presupuesto.

### Fase 3 · Ejecutar · la herramienta de marketing

El grueso. Aquí es donde el equipo trabaja todos los días, y donde las ocho funciones
dejan de ser un reparto en una propuesta y pasan a ser trabajo.

**El armazón:**

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Plan a 90 días** | Hallazgos de la auditoría | Tareas con responsable, semana y criterio de hecho |
| **Tablero por cliente** | — | Qué está en marcha, qué está parado y por qué |
| **Playbooks por función** | Función y tipo de negocio | Las tareas que siempre se hacen, ya creadas |
| **Parte semanal** | — | Qué se ha entregado, redactado y listo para enviar |

**Por función**, que es lo que pediste:

| Función | Herramientas |
| --- | --- |
| **02 Paid** | Estudio de anuncios · lanzar campaña en pausa · pack descargable · lectura de cuenta |
| **03 SEO** | Ver §5 · calendario de contenido · generador de datos estructurados · seguimiento de posiciones |
| **04 Social** | Calendario editorial · generar publicación desde el Brand Kit · rúbrica de revisión mensual |
| **05 Creatividad** | Generación de imagen con marca · variantes por formato · biblioteca de creatividades por cliente |
| **06 Copy** | Ángulos desde el Brand Kit · variantes por longitud · revisión de tono contra el kit |
| **07 Web y CRO** | Editor de landings · publicar · seguimiento de conversión |
| **08 Datos** | Comprobador de medición · circuito del lead de punta a punta · informe mensual |
| **01 Dirección** | Revisión trimestral del reparto contra lo entregado |

**Corte:** tareas con estado y responsable. Sin dependencias, sin estimaciones, sin Gantt.
Y las herramientas por función se construyen **a medida que se venden**, no todas de golpe.

**Fuera:** control horario, vacaciones, facturación por horas.

> Aquí está lo que vende el one-pager: *«el sistema queda documentado, es tuyo y
> permanece»*. Un plan que vive en un documento se pierde; uno que vive en tareas con
> responsable, no.

### Fase 4 · Medir y decidir

Todo interno, porque el cliente no entra.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Panel del cliente** | — | Leads, coste, campañas y estado del plan, en una pantalla |
| **Panel de Valme** | — | Clientes, carga del equipo y riesgo de fuga |
| **Coste por cliente** | — | Lo que cuesta servirlo en IA y herramientas frente a lo que paga |
| **Alertas** | — | Cliente sin leads siete días, campaña parada, plan atascado |
| **Preguntar a los datos** | Pregunta en lenguaje natural | La respuesta con la consulta que la sustenta |

**Corte:** el panel enseña lo que ya está guardado. Nada de modelos predictivos.

**Fuera:** previsión de ingresos, cohortes, atribución multicanal.

> **Coste por cliente es la más infravalorada del roadmap.** Es la única que dice qué
> cliente da dinero, y ya hay media pieza montada: `ai_jobs` lo registra desde el primer
> día. Y «preguntar a los datos» es la única donde la IA es imprescindible y no adorno.

---

## 5. Los accesos: me equivoqué

Dije que los trámites de Meta y Google eran semanas de espera y que había que pedirlos el
primer día. **No es así para lo que vamos a construir**, y el error cambia el orden.

**Meta.** La documentación de niveles de acceso lo dice literalmente: *«Todas las
aplicaciones empresariales reciben automáticamente la aprobación de acceso estándar para
todos los permisos y funciones»*, y *«si solo utilizarán tu aplicación usuarios que tienen
un rol en ella, solo necesitarán acceso estándar»*.

Traducido: la revisión de aplicación y la verificación de empresa hacen falta para **acceso
avanzado**, que es lo que se necesita cuando usuarios ajenos autorizan tu app por OAuth,
o sea, una herramienta pública. Para una herramienta interna que gestiona cuentas a las que
ya tenéis acceso como socio en Business Manager, el acceso estándar es automático. Se crea
la app, se añade un usuario del sistema y se genera el identificador: **horas, no semanas**.

**Google.** La clave de PageSpeed y CrUX es una clave de Google Cloud: se habilita la API y
se crea. Cinco minutos, sin revisión. Search Console necesita OAuth, pero para una
aplicación interna se puede quedar en modo de prueba con usuarios autorizados y tampoco
necesita verificación.

**Lo que sí queda por confirmar** es la Ad Library API, que históricamente pedía
confirmación de identidad del solicitante. Es un trámite personal, no de empresa, y merece
comprobarse antes de contar con ella. El resto, no bloquea nada.

**Consecuencia práctica:** el pack descargable dejaba de ser urgente como plan B para el
lanzamiento en Meta. Sigue siendo útil, pero por otra razón: permite probar anuncios antes
de conectar nada.

---

## 6. La vía rápida de SEO y Paid

Las dos prioridades no esperan a las fases.

### SEO

| | Qué añade |
| --- | --- |
| **Rastreo completo** | Hoy son 40 páginas del sitemap. Subir a todo el sitio, con enlaces internos, huérfanas y profundidad de clic |
| **Search Console** | Con acceso del cliente: consultas, impresiones, posición y CTR. Pasa de diagnóstico a seguimiento continuo |
| **Seguimiento de posiciones** | Un conjunto de palabras por cliente, medido cada semana |
| **GEO** | Aparición en respuestas de IA, medida en el tiempo. Nadie lo está haciendo |
| **Contenido** | Del hallazgo al borrador: qué página falta y un primer texto con el Brand Kit |
| **Datos estructurados** | Generar el JSON-LD que falta, listo para pegar |

### Paid

| | Qué añade |
| --- | --- |
| **Lectura de cuenta** | Inversión, CPL, ROAS y estructura. Es el método Varullo entero |
| **Ad Library** | Lo que corre la competencia, con fechas de inicio |
| **Vigilancia de competidores** | Aviso cuando un rival lanza creatividades nuevas |
| **Estudio de anuncios** | Ya montado como maqueta. Conectar generación real |
| **Lanzar en pausa** | Ya escrito. Con acceso estándar se puede probar ya |
| **Pack descargable** | Para probar anuncios antes de conectar nada |

---

## 7. Cómo se ve al final

```
entra por el formulario
  → diagnóstico automático de su dominio
  → informe y comparativa con tres competidores
  → propuesta con el reparto ajustado a lo encontrado
  → firma y se convierte en cliente, con el Brand Kit ya sembrado
  → plan a 90 días convertido en tareas con responsable
  → ejecución: campañas, contenido, landings, creatividades
  → leads que vuelven y se miden contra la línea base de su auditoría
  → parte semanal que sale redactado
  → panel interno donde se ve qué cliente va bien y cuál no
```

---

## 8. Lo que decidiría ya

**El formulario de la web.** Sin él la fase 1 no tiene entrada. Lo detectó la propia
auditoría al ejecutarla contra valmesolutions.com.

**Qué herramienta de la fase 3 va primera.** No hay que construir las ocho: hay que
construir la del cliente que acabáis de firmar. Esa decisión la tomas tú con el pipeline
delante, no yo con el roadmap.

**Y una que sigue abierta:** el reparto propuesto de la fase 2 tiene que poder bajar
funciones, no solo subirlas. Necesita que alguien defina el criterio de cuándo una función
baja de peso, y eso es de negocio, no de producto.
