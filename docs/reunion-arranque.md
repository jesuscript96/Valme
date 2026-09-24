# Guion de la reunión de arranque

Para la sesión con el equipo. Lo que hay que dar de alta antes, lo que se hace en la
llamada y lo que se lleva cada uno.

---

## Antes de la reunión: los accesos

### 1 · GitHub — el único imprescindible

Repositorio: **`jesuscript96/Valme`**

`Settings` → `Collaborators` → `Add people`. Rol **Write** para cada uno: pueden crear
ramas y abrir pull requests, y no pueden borrar el repositorio ni tocar la configuración.

Después, en `.github/CODEOWNERS`, sustituir los marcadores por sus usuarios reales:

```
@cto   @paid   @seo   @web
```

Con eso GitHub le pide la revisión al dueño de cada fichero automáticamente.

> **Aviso.** Si el repositorio es privado, CODEOWNERS **sugiere** revisor pero no lo
> **exige**: forzarlo con protección de rama necesita plan de pago en GitHub. Mientras
> tanto funciona por acuerdo, que con tres personas basta.

### 2 · Vercel — opcional, y yo no lo daría todavía

No lo necesitan para desarrollar: trabajan en local. Darlo ahora solo añade una forma de
romper producción sin querer. Cuando haga falta, **Viewer** para ver logs y despliegues.

### 3 · Lo que NO hay que dar

Claves de API. Ninguna hace falta para desarrollar las reglas, y las tres herramientas
funcionan sin ellas: lo que no se puede comprobar sale declarado en el informe.

---

## Dónde está todo

| | |
| --- | --- |
| Código | `https://github.com/jesuscript96/Valme` · rama `main` |
| Área en producción | `https://valme-os.vercel.app` |
| Web pública | `https://www.valmesolutions.com` · el área también está en `/app` |
| Contraseña del área | `ruzafa-os-30` |

Emails: `juan@`, `jesus@` (admin), `estrategia@`, `operaciones@` — todos
`@valmesolutions.com`.

---

## En la llamada, compartiendo pantalla

**1 · Enséñales el resultado antes que el código.** Entra en
`https://valme-os.vercel.app/login`, ve a Diagnóstico, abre un lead, entra en un informe.
Que vean a dónde va a parar su trabajo antes de ver un fichero.

**2 · Que lo bajen. Cuatro comandos.**

```bash
git clone https://github.com/jesuscript96/Valme.git
cd Valme
npm install
cp .env.example .env.local
```

Necesitan [Node 22](https://nodejs.org) y [Chrome](https://google.com/chrome) instalados.
Chrome no es opcional: la detección de píxeles carga la página de verdad.

**3 · Que lo arranquen y vean que funciona.**

```bash
npm run audit -- valmesolutions.com
```

Sale el informe de nuestra propia web, con tres hallazgos graves. Es el mejor ejemplo
posible: la empresa que vende medición no tiene medición.

Y el área:

```bash
npm run dev
```

`http://localhost:3000/login`, con su email y la contraseña que hay en `.env.local`.

**4 · Enséñales su fichero.** Abre `src/os/audit/rules/02-paid.ts` con el de paid delante.
Que lea una regla en voz alta. Son cuatro campos en castellano: qué pasa, qué provoca, qué
se hace, y lo grave que es. Ahí se les cae la idea de que esto es programar.

**5 · Que hagan un cambio de mentira y lo suban.** Que cambien una palabra en un texto y
recorran el ciclo entero en la llamada:

```bash
git checkout -b paid/prueba
npm run check
git add -A
git commit -m "Paid: prueba de circuito"
git push -u origin paid/prueba
```

Y que abran el pull request en GitHub. Que el primero se haga acompañado: el segundo ya lo
hacen solos.

---

## Las cuatro cosas que se llevan

**1 · Solo tu fichero.** Si hace falta tocar algo fuera, es señal de que hace falta el CTO.
Abre un issue.

**2 · `npm run check` antes de subir.** Tipos, lint y pruebas en un comando.

**3 · Probado contra tres o cuatro dominios reales, y que uno sea bueno.** Una regla que
salta en todas partes no discrimina; una que no salta nunca no sirve. Ese ajuste es el
trabajo de verdad, no escribir el código.

**4 · Cuando la herramienta esté lista, una línea.** En `src/os/audit/tools.ts`, cambiar
`estado: "en_desarrollo"` por `estado: "listo"`. Eso la enciende sola en la tabla de leads.
Es la definición de terminado y significa: probada con clientes reales y lo que dice se
puede llevar a una reunión.

Todo lo demás está en `docs/guia-equipo.md`. Que lo lean el primer día.

---

## Lo que tienes que decidir tú

**La rama de producción.** Hoy `main` despliega solo a valmesolutions.com. Con tres
personas mergeando, cada pull request aceptado publica la web de la empresa. Lo normal es
apartar eso: crear una rama `production`, apuntar ahí el proyecto de Vercel, y que `main`
sea integración. Cinco minutos en Vercel y se acabó el sobresalto.

**Quién ve qué en Diagnóstico.** Hoy todo el equipo ve todos los leads. Se cambia en un
solo sitio (`src/os/dx/repo.ts`) y es mejor decidirlo antes de que haya leads reales.

**El formulario de la web.** Sigue sin existir, así que no puede entrar ni un lead. Es lo
que alimenta todo lo demás.
