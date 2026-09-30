# Roadmap de producto

De lo que hay hoy a cubrir las cuatro áreas del one-pager. Por fases, con el corte de MVP
de cada una y qué queda fuera a propósito.

---

## 0. Una aclaración antes de empezar

Hay **dos one-pagers** y dos taxonomías distintas. Conviene no mezclarlas:

| | Qué define | Para qué sirve aquí |
| --- | --- | --- |
| **Valme Solutions** (este) | Cuatro áreas de operaciones: Revenue, Internal, Administrative, Executive Intelligence | **El mapa de la aplicación.** Cada área es una parte del producto |
| **Equipo de marketing** | Ocho funciones: paid, SEO, social, creatividad, copy, web, datos, dirección | **El trabajo que se entrega** dentro de la ejecución |

Se cruzan así: las ocho funciones de marketing son *lo que se hace*; las cuatro áreas de
operaciones son *cómo se lleva*. Una auditoría de paid es trabajo de la función 02, pero
vive dentro de Revenue Operations porque su papel es convertir una oportunidad en cliente.

Y el método del one-pager —**diagnóstico, intervención, operación**— no es una fase del
roadmap: es la columna vertebral. Cada área lo recorre entero.

---

## 1. Dónde estamos

Lo que ya funciona en producción:

| | |
| --- | --- |
| **Diagnóstico** | Registro de leads y tres herramientas de auditoría: Paid, SEO y Web. La Web con 51 comprobaciones y el informe por embudo. |
| **Cuentas** | Brand Kit, ofertas, estudio de anuncios, landings, leads del cliente, integraciones. Recorrible con datos de demo. |
| **Base** | Login, ámbito por cliente, contabilidad de coste de IA, dos mitades separadas. |

> **El bloqueo real no es ninguna funcionalidad: es que no hay base de datos.** Todo vive
> en memoria y se pierde al reiniciar. Nada de lo que viene abajo se sostiene sin eso, así
> que no es una fase: es el trabajo del CTO que va en paralelo desde el primer día.

**Cobertura actual sobre las cuatro áreas:** Revenue a medias, las otras tres a cero.

---

## 2. El principio de diseño

Todo lo que se construya es una **herramienta**: una entrada, una salida, un botón.

Eso tiene una consecuencia que conviene tener clara desde ahora. Si cada capacidad es una
herramienta con su contrato, la capa de conversación —pedirle a un asistente que haga algo
en vez de buscar el botón— se añade después **sin rehacer nada**: el asistente llama a las
mismas herramientas. Si se construye como pantallas con lógica dentro, esa capa hay que
volver a escribirla entera.

Por eso en el roadmap todo se nombra como herramienta y no como pantalla.

---

## 3. Las fases

El orden sigue el ciclo de vida de un cliente, no las áreas. Eso lo hace horizontal por
construcción: al final de la fase 4 se puede llevar a alguien desde el primer contacto
hasta la factura, aunque sea de forma básica en cada paso.

### Fase 1 · Captar y diagnosticar

**Lo que se podrá hacer:** entra un lead por el formulario, y con su dominio sale un
informe que se puede llevar a una reunión.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Formulario de captación** | — | Un lead en el sistema. *Hoy la web no tiene formulario: no puede entrar nada* |
| **Diagnóstico completo** | Dominio | Las tres auditorías en una pasada |
| **Comparativa con competidores** | Dominio + 3 rivales | El mismo informe sobre los cuatro, en una tabla |
| **Informe para el cliente** | Una auditoría | PDF con portada, hallazgos y plan a 90 días |
| **Aviso de lead nuevo** | — | Correo o WhatsApp al comercial cuando entra uno |

**Corte de MVP:** el informe es un PDF generado, no un editor. Se descarga y se envía a
mano.

**Fuera:** puntuación automática de calidad del lead, secuencias de seguimiento.

> La comparativa es lo que más cambia la conversación. Una auditoría se archiva; una
> comparativa se enseña y se reenvía al jefe.

### Fase 2 · Vender · Revenue Operations

**Lo que se podrá hacer:** de la auditoría sale la propuesta, y de la propuesta el cliente.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Generador de propuesta** | Una auditoría | Propuesta con el reparto de las ocho funciones ajustado a los hallazgos |
| **Calculadora de alcance** | Nº de recursos y meses | Precio, con el modelo de 2.500 € por recurso |
| **Propuesta como página** | Propuesta | Enlace propio que se abre, se comenta y avisa cuando la ven |
| **Firma** | Propuesta aceptada | Contrato firmado, con proveedor externo |
| **Convertir lead en cliente** | Lead ganado | Cliente creado, con la auditoría como línea base y el Brand Kit medio sembrado |

**Corte de MVP:** el pipeline son cinco estados en una columna, no un CRM. Sin
previsiones, sin ponderaciones, sin actividad.

**Fuera:** CRM completo, informes comerciales, gestión de equipo comercial.

> Que la propuesta sea una **página y no un PDF** es lo que convierte esta fase en
> producto: sabes cuándo la han abierto, cuánto rato han estado y en qué apartado. Eso es
> información de venta que hoy no tenéis.

### Fase 3 · Ejecutar · Internal Operations

**Lo que se podrá hacer:** el plan a 90 días deja de ser un documento y pasa a ser trabajo
asignado.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Plan a 90 días** | Hallazgos de la auditoría | Tareas con responsable, semana y criterio de hecho |
| **Tablero por cliente** | — | Qué está en marcha, qué está parado y por qué |
| **Playbooks por función** | Función y tipo de negocio | Las tareas que siempre se hacen, ya creadas |
| **Parte semanal** | — | Qué se ha entregado esta semana, listo para enviar al cliente |
| **Carga del equipo** | — | Cuánto hay asignado a cada persona frente a lo vendido |

**Corte de MVP:** tareas con estado y responsable. Sin dependencias, sin estimaciones, sin
diagrama de Gantt.

**Fuera:** control horario, facturación por horas, gestión de vacaciones.

> Aquí está el núcleo de lo que vende el one-pager: *«el sistema queda documentado, es
> tuyo y permanece»*. Un plan que vive en un documento se pierde; uno que vive en tareas
> con responsable, no.

### Fase 4 · Cobrar · Administrative Operations

**Lo que se podrá hacer:** la factura sale del contrato sin que nadie la escriba.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Facturación recurrente** | Contrato | Factura mensual generada y enviada |
| **Control de cobros** | — | Qué está pendiente, desde cuándo y a quién reclamar |
| **Aviso de impago** | Factura vencida | Recordatorio automático, escalando |
| **Almacén de documentos** | — | Propuesta, contrato, facturas e informes de cada cliente, en un sitio |
| **Coste por cliente** | — | Lo que cuesta servirlo: IA, herramientas y horas frente a lo que paga |

**Corte de MVP:** integración con el sistema de facturación que ya uséis, no uno nuevo.
Generar y avisar, no llevar la contabilidad.

**Fuera:** contabilidad, impuestos, conciliación bancaria.

> **Coste por cliente es la herramienta más infravalorada de todo el roadmap.** Es la única
> que dice qué cliente da dinero y cuál no, y ya tenéis media pieza montada: `ai_jobs`
> registra el coste de IA por cliente desde el primer día.

### Fase 5 · Decidir · Executive Intelligence

**Lo que se podrá hacer:** la información está antes de pedirla.

| Herramienta | Entrada | Salida |
| --- | --- | --- |
| **Panel del cliente** | — | Leads, coste, campañas y estado del plan, en una pantalla |
| **Panel de Valme** | — | Clientes, margen, carga y riesgo de fuga |
| **Resumen semanal** | — | Qué ha cambiado esta semana, en cinco líneas, al correo |
| **Alertas** | — | Un cliente sin leads siete días, una campaña parada, un pago vencido |
| **Preguntar a los datos** | Pregunta en lenguaje natural | La respuesta con la consulta que la sustenta |

**Corte de MVP:** el panel enseña lo que ya está en la base de datos. Nada de modelos
predictivos.

**Fuera:** previsión de ingresos, análisis de cohortes, atribución multicanal.

> «Preguntar a los datos» es la única herramienta de este roadmap donde la IA es
> imprescindible y no un adorno. Y es la que hace realidad lo de *«a golpe de mensaje»*.

---

## 4. La vía rápida de SEO y Paid

Las dos prioridades no esperan a las fases: van en paralelo desde el principio, porque son
las que venden y las que ejecutáis.

### SEO

| | Qué añade |
| --- | --- |
| **Rastreo completo** | Hoy son 40 páginas del sitemap. Subir a todo el sitio con enlaces internos, huérfanas y profundidad de clic |
| **Search Console** | Con acceso del cliente: consultas reales, impresiones, posición y CTR. Pasa de diagnóstico a seguimiento |
| **Seguimiento de posiciones** | Un conjunto de palabras por cliente, medido cada semana |
| **GEO** | Aparición en respuestas de IA, medida en el tiempo. Nadie lo está haciendo todavía |
| **Contenido** | Del hallazgo al borrador: qué página falta y un primer texto con el Brand Kit |
| **Datos estructurados** | Generar el JSON-LD que falta, listo para pegar |

### Paid

| | Qué añade |
| --- | --- |
| **Ad Library** | Lo que corre la competencia, con fechas. Necesita la app de Meta |
| **Vigilancia de competidores** | Aviso cuando un rival lanza creatividades nuevas |
| **Lectura de cuenta** | Con acceso: inversión, CPL, ROAS y estructura. Es el método Varullo entero |
| **Estudio de anuncios** | Ya montado como maqueta. Conectar generación real |
| **Lanzar en pausa** | Ya escrito. Necesita el acceso aprobado de Meta |
| **Pack descargable** | El plan B mientras no llegue. **Conviene tenerlo antes que la API** |

> Estas dos son también las que más dependen de trámites ajenos. La app de Meta tarda
> semanas y Search Console necesita que el cliente dé acceso. **Ambas se piden el primer
> día**, no cuando toque construirlas.

---

## 5. Cómo se ve al final

Cuando esté, un cliente recorre esto sin que nadie copie nada entre herramientas:

```
entra por el formulario
  → diagnóstico automático de su dominio
  → informe y comparativa con tres competidores
  → propuesta con el reparto ajustado a lo encontrado
  → firma
  → se convierte en cliente con su Brand Kit ya sembrado
  → plan a 90 días convertido en tareas con responsable
  → ejecución: campañas, landings, contenido
  → leads que vuelven y se miden contra la línea base de su auditoría
  → factura mensual automática
  → panel donde ve lo que ha pasado sin pedirlo
```

Ese recorrido **es** el one-pager: diagnóstico, intervención y operación, sobre las cuatro
áreas.

---

## 6. Lo que decidiría ya

**Base de datos, esta semana.** Es lo único que bloquea todo lo demás, y cada semana que
pasa se construye más encima de datos que se borran al reiniciar.

**El formulario de la web.** Sin él la fase 1 no tiene entrada. Lo detectó la propia
auditoría al ejecutarla contra valmesolutions.com.

**Los trámites de Meta y Google.** Semanas de espera que no dependen de programar nada.

**Y una que no es técnica: ¿el cliente entra en la aplicación o no?** Cambia bastante el
diseño de las fases 3 y 5. Si entra, el panel y el parte semanal son producto; si no, son
un correo. Yo empezaría por que no entre y abrirlo cuando haya algo que enseñar que
aguante una mirada externa.
