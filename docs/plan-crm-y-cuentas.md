# CRM y Cuentas: la división de la aplicación

Propuesta para partir Valme OS en dos mitades antes de que el equipo empiece a desarrollar.

---

## 1. La razón de fondo no es organizativa, es de permisos

La división que planteas coincide con algo que ya estaba pidiendo el código: **las dos
mitades tienen modelos de acceso incompatibles.**

| | **CRM** | **Cuentas** |
| --- | --- | --- |
| De quién son los datos | De Valme | Del cliente |
| Unidad | El prospecto | El cliente |
| Quién ve qué | Todo el equipo comercial ve todo el embudo | Solo quien tiene asignado ese cliente |
| Cómo se aísla | Por rol | Por `client_id`, con RLS en Postgres |
| Cuándo | Antes de firmar | Después de firmar |

Esa última fila es la que obliga. Cuando entre Supabase, **las tablas de cliente llevarán
Row Level Security por `client_id`**: cada fila solo la ve quien es miembro de ese cliente.
Si los prospectos viven en esa misma tabla, pasa una de dos cosas: o rompes la RLS para que
el comercial vea su embudo, o el comercial no ve su embudo.

No hay una tercera. Por eso son dos mitades y no dos menús.

> **Corrección a lo que propuse la semana pasada.** Dije de añadir `prospect` al estado del
> cliente para poder auditar antes de firmar. Con esta división, eso está mal: un prospecto
> y un cliente son dos entidades distintas que se enlazan al ganar, no la misma en dos
> estados. Un prospecto perdido tampoco es un cliente pausado.

---

## 2. Cómo queda

### Rutas

```
/app
  /crm                        ← LADO CRM · datos de Valme
    /pipeline                 el embudo, por etapas
    /prospects                prospectos
    /prospects/[id]           ficha: web, contactos, actividad, auditorías
    /prospects/[id]/audit     la auditoría (usa el recolector que ya existe)
    /inbox                    leads que entran a Valme
    /deals/[id]               oportunidad: propuesta, importe, etapa

  /clients                    ← LADO CUENTAS · puerta
  /c/[cliente]/…              todo lo que ya existe, sin tocar
```

En la interfaz: **CRM** y **Cuentas**. Un conmutador arriba del todo, no un elemento más de
la navegación lateral: son dos contextos, no dos secciones.

### Código

```
src/os/
  core/        sesión, UI, proveedores, coste de IA · del CTO, nadie más lo toca
  audit/       el recolector y las reglas · COMPARTIDO por las dos mitades
  crm/         prospectos, embudo, oportunidades, actividad
  accounts/    brand kit, ofertas, creatividades, landings, leads del cliente
```

Cuatro carpetas y una regla:

> **`crm/` y `accounts/` no se importan nunca entre sí.** Lo que necesiten compartir sube a
> `core/`.

Esa regla se puede comprobar sola. Se añade a la configuración de ESLint y el CI rechaza el
PR que la rompa. Una frontera que no se puede verificar se cruza en tres semanas.

---

## 3. Dónde va la auditoría

Es la pregunta interesante, porque la respuesta no es obvia: **en ninguna de las dos.**

La auditoría la usan las dos mitades y para cosas distintas:

- **En CRM**, sobre un prospecto: es la herramienta de venta.
- **En Cuentas**, sobre un cliente: es el control periódico de lo que llevamos.

Si se mete en `crm/`, el día que Cuentas la necesite habrá que sacarla de allí, y para
entonces tendrá dependencias del embudo. Va en `audit/`, como capacidad compartida, y cada
mitad la invoca con lo suyo.

Mismo criterio para los proveedores (Firecrawl, Claude, Higgsfield, Meta): van en `core/`.

---

## 4. El momento de la conversión

Es la única costura entre las dos mitades, y conviene que sea una sola función:

```ts
convertirProspecto(prospectoId) → slug del cliente
```

Qué hace:

1. Crea el cliente en el lado Cuentas.
2. **Le pasa la auditoría.** Pasa a ser la línea base del cliente: dentro de seis meses se
   podrá comparar cómo estaba el día que firmó.
3. **Siembra el Brand Kit** con lo que la auditoría ya rastreó: identidad visual, mensaje,
   páginas. El cliente entra con el kit medio hecho, sin repetir el rastreo.
4. Marca el prospecto como ganado y lo enlaza al cliente. No lo borra: el histórico
   comercial se queda en CRM.

Esa función es del CTO. Es donde se cruzan los dos modelos de permisos y es el sitio más
fácil de estropear.

---

## 5. Qué hay que construir en cada lado

**CRM**, que hoy no existe:

| | |
| --- | --- |
| `prospects` | empresa, web, sector, tamaño, origen, propietario |
| `contacts` | personas del prospecto |
| `deals` | oportunidad: etapa, importe, oferta, fecha prevista |
| `activities` | llamadas, correos, notas, con fecha y autor |
| `inbound_leads` | lo que entra por la web de Valme |
| `audits` | enlazadas al prospecto |

Etapas propuestas, calcadas de cómo vendéis: **Nuevo → Auditado → Reunión → Propuesta →
Ganado / Perdido**. La auditoría es una etapa porque en vuestro proceso la auditoría *es* la
venta. Confirmadlo vosotros: las etapas las define quien vende, no quien programa.

Un detalle que va antes que todo lo demás: **la web de Valme no tiene formulario**, así que
hoy no hay nada que entre a `inbound_leads`. Lo detectó la propia auditoría al ejecutarla
contra vuestro dominio. Montar el CRM sin arreglar eso es construir una bandeja de entrada
sin buzón.

**Cuentas**, que ya existe: se queda igual. Solo cambia de carpeta.

---

## 6. Qué desarrolla el equipo, ahora que hay dos sitios

Aquí quiero ser claro porque es donde esto se puede torcer.

El modelo de las reglas funciona porque **la superficie es diminuta**: un fichero, un array,
una forma fija. Alguien que no programa puede aportar criterio real sin romper nada. Si
ahora les pedimos pantallas, formularios y consultas en dos mitades distintas, el modelo se
cae y el CTO acaba reescribiéndolo.

La versión que sí escala es la misma idea en los tres sitios: **ellos aportan el criterio
como datos, el CTO aporta la máquina.**

| Dónde | Qué aporta el especialista | Forma |
| --- | --- | --- |
| `audit/rules/` | Qué se comprueba y qué significa | Un fichero por área. Ya montado. |
| `crm/scoring/` | Qué hace bueno a un lead y qué lo descarta | Mismo patrón: reglas con señales del prospecto |
| `accounts/playbooks/` | Qué se entrega en los 90 días de cada área | Listas de acciones con responsable y semana |

Las tres son ficheros de criterio, se prueban con `npm run check` y no tocan infraestructura.
Y las tres sirven igual el día que el CTO cambie por debajo la base de datos entera.

Si alguien del equipo quiere además hacer interfaz, perfecto, pero eso ya es emparejarse con
el CTO, no trabajar en paralelo.

---

## 7. Qué cuesta hacerlo

**Casi nada, hoy.** Es mover carpetas y ajustar importes. Nadie tiene ramas abiertas, así
que no hay conflictos que resolver.

En dos semanas, con cinco personas y ramas vivas, el mismo cambio son dos días de conflictos
y un fin de semana de mal humor. **Este es el momento más barato que va a haber.**

El orden:

1. Mover `accounts/` y `core/` a su sitio, sin cambiar nada por dentro.
2. Añadir la regla de ESLint que impide que las mitades se importen.
3. Crear `crm/` vacío con su guardia de permisos y su primera pantalla.
4. Actualizar CODEOWNERS y la guía del equipo con la nueva estructura.

Y una comprobación que no me saltaría: que la web comercial y el área siguen funcionando
igual después de mover. Es un refactor mecánico, pero mecánico no quiere decir inofensivo.

---

## 8. Lo que hay que decidir antes de tocar nada

1. **Las etapas del embudo.** Las de arriba son una propuesta leyendo vuestro one-pager.
2. **Quién ve qué en CRM.** ¿Todo el equipo comercial ve todo el embudo, o cada uno lo suyo?
   Cambia la guardia de permisos, y cambiarla después es peor.
3. **Si el CRM sustituye a algo que ya usáis.** Si hoy el embudo vive en una hoja de cálculo
   o en otra herramienta, hay que decidir si esto la reemplaza o convive. Convivir sin
   decidirlo es acabar con dos embudos y ninguno fiable.
