# Empezar

Para quien lleva un área de marketing. **No hace falta saber programar ni usar la
terminal.**

---

## Lo que instalas, una vez

| | Para qué |
| --- | --- |
| [GitHub Desktop](https://desktop.github.com) | Bajar el código y subir tus cambios. Todo con botones. |
| [Cursor](https://cursor.com) o [VS Code](https://code.visualstudio.com) | Editar y ejecutar. |
| [Node 22](https://nodejs.org) | Lo que hace funcionar el proyecto. Se instala y se olvida. |
| [Google Chrome](https://google.com/chrome) | La herramienta carga las webs con él para ver qué tienen instalado. |

---

## Bajarte el proyecto

En GitHub Desktop: **File → Clone repository**, pestaña **GitHub.com**, eliges `Valme`.

Luego **Open in Cursor** (o en VS Code). Ya lo tienes.

La primera vez, en el editor: panel **NPM Scripts** en la barra lateral y pulsa **install**.
Tarda un par de minutos y no hay que volver a hacerlo.

> Si usas Cursor o Claude Code, puedes saltarte esto y pedírselo: *«instala las
> dependencias y arranca el proyecto»*. Lo hace solo.

---

## Tu fichero

Cada área tiene el suyo y solo tocas el tuyo.

| Herramienta | Tu fichero |
| --- | --- |
| **Auditoría de Paid** | `src/os/audit/rules/02-paid.ts` |
| **Auditoría de SEO** | `src/os/audit/rules/03-seo.ts` |
| **Auditoría Web** | `src/os/audit/rules/07-web.ts` y `08-datos.ts` |

Dentro hay reglas ya escritas. Una regla tiene cuatro campos, en castellano:

- **Situación.** Qué pasa. Sin juicio.
- **Consecuencia.** Qué provoca. Aquí va el impacto.
- **Solución.** Qué se hace. Concreto.
- **Gravedad.** `p0` está roto hoy · `p1` pérdida clara · `p2` oportunidad · `p3` menor.

Si algo está bien montado, también se dice: se marca como positivo y sale en su propio
bloque, antes de los problemas.

Arriba del fichero está la lista de datos que puedes usar. Si necesitas uno que no está,
no lo inventes: abre un *issue* en GitHub contando qué querrías saber del dominio y para
qué.

---

## Probarlo

En el panel **NPM Scripts** del editor:

- **dev** → abre `http://localhost:3000/login` y entras con tu email y la contraseña que
  te pasen. Ahí ves el área entera.
- **audit** → ejecuta tu herramienta contra un dominio.

> Con Cursor o Claude Code: *«ejecuta la auditoría contra tallerrivas.com»*.

**Pruébalo contra tres o cuatro dominios reales, y que uno sea bueno.** Una regla que
salta en todas partes no distingue nada; una que no salta nunca no sirve. Ese ajuste es el
trabajo de verdad, no escribir el código.

---

## Subir tus cambios

Todo en GitHub Desktop:

1. Arriba a la izquierda, **Current Branch → New Branch**. Ponle tu nombre y lo que haces:
   `paid/rotacion-creativa`. Trabaja siempre en tu rama, nunca en `main`.
2. Cuando tengas algo, abajo a la izquierda escribes en una línea qué has hecho y pulsas
   **Commit**.
3. **Push origin**.
4. Sale un botón **Create Pull Request**. Cuéntalo en dos líneas: qué detecta y contra qué
   dominios lo has probado.

GitHub pasa las comprobaciones solo. Si sale una marca verde, todo bien; si sale roja,
pincha y te dice qué falla. Cuando esté revisado, se integra.

---

## Cuando tu herramienta esté terminada

Una línea. En `src/os/audit/tools.ts`, cambia el estado de la tuya:

```ts
estado: "en_desarrollo"   →   estado: "listo"
```

Eso la enciende sola en la tabla de leads, donde se lanzan las tres a la vez. Es la
definición de terminado, y significa: probada con clientes reales y lo que dice se puede
llevar a una reunión.

---

## Lo único que hay que respetar

**Solo tu fichero.** Si necesitas cambiar algo fuera, abre un issue en vez de tocarlo. Es
lo que evita que dos personas se pisen.
