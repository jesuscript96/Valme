# Auditoría de Paid en la plataforma

Cómo montar el método Varullo dentro de Valme OS. Plan breve: el planteamiento y el orden.

---

## 1. Lo primero: esto no es lo que propusimos antes

Son dos auditorías distintas y conviene no mezclarlas.

| | **Auditoría comercial** (`plan-auditoria-comercial.md`) | **Auditoría de Paid** (este documento) |
| --- | --- | --- |
| Cuándo | Fase de venta, antes de firmar | Con el cliente dentro, o en venta avanzada |
| Entrada | Un dominio | Accesos, exports, capturas y datos de CRM |
| Profundidad | 75 señales externas | El método completo: medición, estructura, audiencias, creatividad, métricas, plan |
| Automatización | 63 de 75 sin intervención | Human-in-the-loop por diseño |
| Salida | Comparativa y reparto propuesto | Documento de auditoría y backlog del día 1 |

**Encajan de punta a punta.** La última página de la auditoría comercial es *"qué necesitamos ver para afinarlo: Analytics, Ads, CRM"*. Esa petición es exactamente la entrada de esta. Una es la puerta, la otra es la casa.

---

## 2. Dónde vive

Dentro de Valme OS, como área nueva del cliente. Reutiliza todo lo que ya está montado:
sesión, ámbito por cliente, `ai_jobs` para el coste, el shell y las primitivas.

```
/app/c/[client]/audits                       lista
/app/c/[client]/audits/new                   arranque: contrato de datos
/app/c/[client]/audits/[id]                  estado y cobertura
                      /contrato              C2: período, moneda, definiciones
                      /evidencias            registro EV-001…
                      /bloques/[bloque]      los 14 bloques de B3
                      /hallazgos             vista transversal, priorizada
                      /plan                  90 días
                      /documento             vista previa y exportación
```

**Un cambio pequeño en el modelo:** `clients.status` pasa a incluir `prospect`. Una
auditoría se puede abrir sobre un prospecto que todavía no es cliente. Si firma, el
prospecto se convierte en cliente y ya trae dentro su auditoría, su contrato de datos y su
Brand Kit medio extraído.

---

## 3. La idea que sostiene todo: el método es dato, no código

El manual lo exige él mismo:

> *«Las definiciones de MQL y SQL, exclusiones geográficas, objetivos de CPA, plazos para
> evaluar anuncios y umbrales se acuerdan por cliente. Nunca se reutilizan cifras de un
> proyecto en otro.»*

Eso convierte en error de diseño meter un solo umbral en el código. La checklist, los
bloques del documento, las reglas de tono y los umbrales viven en un **perfil de método**
que es una fila en la base de datos.

Consecuencias, todas buenas:

- El método Varullo es un perfil. El de Valme puede ser otro.
- Los umbrales por cliente son otra capa encima, como pide el manual.
- Cuando Diego confirma un criterio nuevo, se versiona con fecha y alcance — que es
  literalmente lo que pide el Anexo 10, *«versionado del criterio de Diego»*.

> **Una pregunta que hay que resolver antes de escribir código:** el documento dice «Método
> Varullo · Diego Vallejo». Si Varullo es cliente, el método es suyo y empotrarlo en la
> plataforma de Valme es un problema de producto y quizá de contrato. Con perfiles no hay
> que decidirlo hoy, pero hay que decidirlo.

---

## 4. Las cuatro reglas del manual que se convierten en código, no en prompt

Aquí está la diferencia entre pegar el manual en un system prompt y construir una
herramienta. Un prompt pide; un sistema impide.

**1 · «Nunca inventes datos» → cada cifra referencia una evidencia.**
El esquema de salida obliga a que toda afirmación numérica lleve `evidenceId`. El compositor
rechaza un hallazgo cuyas cifras no resuelvan contra una fila del registro de evidencias. No
es una súplica en el prompt: es validación de esquema.

**2 · La tabla C9 es una tabla de reglas ejecutable.**
El manual lista seis observaciones con la conclusión que no debe adelantarse y las
comprobaciones previas obligatorias. Eso se codifica tal cual: si un hallazgo concluye «la
creatividad ya no funciona» y CPC, CVR, tracking, oferta, mix y madurez no están
`VERIFICADO`, el hallazgo no pasa. Se degrada a hipótesis con sus pendientes listados.

**3 · El Anexo 9 es la puerta de exportación.**
Sus diecisiete comprobaciones se convierten en un chequeo previo. El botón de exportar está
bloqueado hasta que pasan. La mayoría son verificables mecánicamente: totales conciliados,
ratios recalculados desde numerador y denominador, sin atribución conservada, sin guiones
largos, áreas pendientes marcadas.

**4 · El estado de revisión es un campo, no una sensación.**
`VERIFICADO` · `PARCIAL` · `PENDIENTE DE VALIDAR` · `NO APLICA` en cada comprobación, con el
motivo y qué evidencia falta. Es lo único que impide *«declarar completa una auditoría con
áreas relevantes sin acceso»*, y una portada que dice «cobertura 62 %» es más creíble que
una que finge estar entera.

---

## 5. Lo más difícil no es la IA: es el contrato de datos

La Parte C ocupa el 40 % del manual por una razón. Una herramienta que acierte con el
modelo y falle con los cruces produce disparates con mucha seguridad, que es lo peor que
puede pasar en una reunión de venta.

Antes de calcular nada, el contrato fija por escrito: cuenta, moneda, zona horaria, período,
fecha de corte y de extracción, qué cuenta como lead, MQL, SQL y cliente nuevo, qué fecha se
usa, tratamiento de impuestos y devoluciones, y ventana de atribución por plataforma.

Y tres invariantes que se comprueban en código, no a ojo:

- **El total de gasto no cambia después de un cruce.** El manual avisa del error clásico:
  unir gasto diario a cada lead y sumar después. Se asserta.
- **Los ratios se recalculan desde numerador y denominador**, nunca se promedian ratios.
- **Período y cohorte son dos campos distintos**, calculados por separado. No se pueden
  confundir porque no comparten variable.

---

## 6. El flujo, que es de taller y no de botón

El método de Diego (B4) tiene validaciones humanas dentro. Si se construye como
«dominio entra, PDF sale», se rompe el método.

```
1. Contrato de datos            persona · formulario del Anexo 6
2. Estructura del documento     bot propone → DIEGO VALIDA
3. Evidencias por bloques       subida de exports y capturas
4. Métricas                     determinista, con conciliación
5. Hallazgos por bloque         IA propone → persona edita y valida
6. Nueva estructura de campañas SE DISCUTE ANTES → luego entra
7. Plan a 90 días               IA propone → persona ajusta
8. Chequeo del Anexo 9          bloquea la exportación
9. Documento
```

Los pasos en mayúsculas son estados explícitos de la auditoría: «esperando validación». No
son fricción, son el método.

---

## 7. Entrada de datos: primero exports, después conector

El manual ya contempla las dos vías. En orden de construcción:

1. **Exports CSV y XLSX** de Meta y Google. Es la vía real hoy y la que no depende de
   ningún permiso.
2. **Capturas con visión.** Con una regla del propio manual que es también una restricción
   técnica útil: *«una conclusión por captura»*. Cada imagen produce exactamente un hallazgo
   candidato y queda registrada como evidencia.
3. **Conector de Meta.** Reutiliza el OAuth y el cliente de Marketing API que ya están
   escritos para lanzar campañas; leer insights es el mismo cliente con otro endpoint.

---

## 8. Plan de construcción

| Fase | Qué | Por qué en este orden |
| --- | --- | --- |
| **1** | Contrato, registro de evidencias y hallazgos **a mano**. Sin IA. | Ya estandariza, que es lo que se pedía. Y obliga a validar la checklist con auditorías reales antes de automatizar nada. |
| **2** | Ingesta de exports y capa de métricas con conciliación. Determinista. | Es la parte difícil y la que sostiene todo lo demás. |
| **3** | Interpretación con IA por bloque y lectura de capturas. | Solo tiene sentido sobre datos ya conciliados. |
| **4** | Composición del documento y chequeo del Anexo 9. | |
| **5** | Conector de Meta. | Depende del acceso de la app, que tarda. |

**La fase 1 sola ya vale.** Un taller que obliga al contrato de datos, numera las evidencias
y no deja cerrar un hallazgo sin situación, consecuencia y solución hace que dos personas
distintas entreguen la misma auditoría. Eso es estandarizar, y no necesita una línea de IA.

---

## 9. Coste y riesgos

**Coste por auditoría:** entre 3 y 5 $ de modelo, contando iteraciones y lectura de treinta
capturas. Irrelevante frente a lo que vale una auditoría.

**Riesgos, por orden de gravedad:**

1. **Un cruce mal hecho con cara de certeza.** Es el riesgo real. Se contiene con los
   invariantes de §5 y con que ningún número salga sin evidencia detrás.
2. **Construirlo como chatbot.** El manual está escrito como prompt porque nació en un chat.
   Un chat pierde EV-014 en la página nueve. Lo que aporta la plataforma es exactamente la
   persistencia que el chat no tiene: el registro de evidencias, el estado por comprobación
   y la conciliación. Si se copia el manual a un system prompt y se da por hecho, no hemos
   construido nada.
3. **Automatizar las validaciones humanas.** Quitar los pasos en mayúsculas del §6 parece
   una mejora y es quitarle el método.
4. **Umbrales que se cuelan de un cliente a otro.** Lo prohíbe el manual y lo previene el
   diseño de §3, pero es la regresión más fácil de introducir.
