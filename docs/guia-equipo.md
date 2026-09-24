# Guía para el equipo

Para las personas que llevan cada área de marketing. **No hace falta saber programar.**
Sí hace falta seguir tres reglas.

---

## La idea

Tú sabes qué mirarías en una cuenta. Esa es la parte difícil y es la que no se puede
subcontratar. Lo que haces aquí es escribir ese criterio en un fichero con una forma fija,
para que la herramienta lo aplique sola a cualquier dominio.

**No estás construyendo la aplicación.** De eso se encarga el CTO: usuarios, base de datos,
pantallas, permisos, despliegue. Tú aportas el criterio.

El reparto, en una frase:

> Tú decides **qué se comprueba y qué significa**. El CTO decide **cómo se ejecuta y dónde
> se guarda**.

Si respetas esa frontera, tu trabajo se aprovecha entero. Si te sales de ella y empiezas a
tocar pantallas o base de datos, el CTO tendrá que tirarlo y rehacerlo.

---

## Puesta en marcha, una sola vez

Necesitas: una cuenta de GitHub, [Node 22](https://nodejs.org) y
[Google Chrome](https://google.com/chrome) instalado.

```bash
git clone https://github.com/<organizacion>/<repo>.git
cd <repo>
npm install
cp .env.example .env.local
```

Comprueba que todo funciona:

```bash
npm run audit -- valmesolutions.com
```

Si sale un informe con hallazgos, ya lo tienes montado.

Para ver el área de admin en el navegador:

```bash
npm run dev
```

Y abre `http://localhost:3000/login`. Las credenciales de desarrollo están en `.env.local`.

---

## Tu fichero

Cada área tiene el suyo. **Solo tocas el tuyo.**

| Área | Fichero |
| --- | --- |
| 01 Dirección y estrategia | `src/os/audit/rules/01-estrategia.ts` |
| 02 Paid media | `src/os/audit/rules/02-paid.ts` |
| 03 SEO, contenido y GEO | `src/os/audit/rules/03-seo.ts` |
| 04 Social orgánico | `src/os/audit/rules/04-social.ts` |
| 05 Creatividad, diseño y vídeo | `src/os/audit/rules/05-creatividad.ts` |
| 06 Mensaje y copy | `src/os/audit/rules/06-copy.ts` |
| 07 Web, landings y CRO | `src/os/audit/rules/07-web.ts` |
| 08 Datos, CRM y leads | `src/os/audit/rules/08-datos.ts` |

Está configurado para que GitHub te pida a ti la revisión de tu fichero y a nadie más. Como
cada uno trabaja en el suyo, los cambios no chocan nunca.

---

## Qué es una regla

Una regla mira una o varias **señales** (hechos que la herramienta ya ha recogido del
dominio) y decide si hay algo que decir. Si lo hay, produce un **hallazgo** con cuatro
partes que siempre son las mismas:

- **Situación.** Qué pasa. Sin juicio.
- **Consecuencia.** Qué provoca. Aquí va el impacto.
- **Solución.** Qué se hace. Concreto.
- **Gravedad.** `p0` a `p3`.

```ts
{
  id: "sin_pixel",
  funcion: 2,
  necesita: ["paid.pixel_meta"],
  evaluar: (v) => !v.bool("paid.pixel_meta") ? H(
    "No hay píxel de Meta instalado",
    "La página no carga el píxel de Meta.",
    "Sin píxel no se puede hacer retargeting, ni construir audiencias similares, ni medir qué anuncio trae qué. Y el histórico no se recupera.",
    "Instalar el píxel y configurar los eventos que importan para el negocio.",
    "p1") : null,
}
```

`necesita` es la lista de señales que usas. Si alguna no se ha podido comprobar en ese
dominio, **tu regla no se ejecuta**. Eso es a propósito: no queremos decirle a nadie «no
tienes píxel» cuando la verdad es que no hemos podido mirarlo.

### Las gravedades

| | Cuándo |
| --- | --- |
| `p0` | Está roto. Se pierde dinero o leads hoy. |
| `p1` | Pérdida clara y demostrada. |
| `p2` | Oportunidad que merece la pena probar. |
| `p3` | Mejora menor o mantenimiento. |

### Los positivos también son reglas

Si algo está bien montado, se dice. Pon `true` al final y sale en su propio bloque, antes de
los problemas. Un informe que solo tiene problemas no se lee: se defiende.

---

## Qué señales tienes disponibles

Las de tu área están listadas en la cabecera de tu fichero. Para verlas todas con los
valores reales de un dominio:

```bash
npm run audit -- undominio.com --json señales.json
```

Abre `señales.json` y mira el array `señales`. Cada una tiene su `id`, su `valor` y su
`estado`.

**¿Necesitas una señal que no existe?** No la inventes: abre un *issue* en GitHub
describiendo qué querrías saber del dominio y para qué. Recoger datos nuevos lo hace el CTO,
porque toca la parte compartida.

---

## Cómo trabajar

```bash
git checkout main
git pull                              # empieza siempre desde lo último

git checkout -b paid/rotacion-creativa   # tu-area/lo-que-haces
```

Edita tu fichero. Pruébalo contra dominios reales:

```bash
npm run audit -- undominio.com
npm run audit -- otrocliente.es
```

Prueba con **tres o cuatro dominios distintos**, y que uno sea bueno. Una regla que salta en
todas partes no discrimina, y una que no salta nunca no sirve. Ese ajuste es tu trabajo.

Antes de subir nada:

```bash
npm run check
```

Si sale en verde, adelante. Si sale en rojo, léelo: suele decir exactamente qué falta.

```bash
git add src/os/audit/rules/02-paid.ts
git commit -m "Paid: detecta anuncios sin rotar en más de 180 días"
git push -u origin paid/rotacion-creativa
```

Entra en GitHub, abre el *pull request* y cuenta en dos líneas qué detecta y contra qué
dominios lo has probado. El CTO lo revisa y lo integra.

---

## Trabajar con la IA

Está para esto y conviene usarla. Lo que funciona:

> «Abre `src/os/audit/rules/02-paid.ts`. Quiero una regla que detecte cuando todos los
> anuncios llevan a la home en vez de a una landing. Mira qué señales hay disponibles,
> escribe la regla y pruébala contra tallerrivas.com y dos competidores suyos.»

Tres cosas que te ahorran disgustos:

- **Dile siempre en qué fichero trabajas.** Si no, tocará otros y el PR se complica.
- **Pídele que lo pruebe contra dominios reales** antes de dártelo por bueno. Una regla que
  compila no es una regla que acierte.
- **Lee el texto del hallazgo tú.** La IA redacta bien y se equivoca con seguridad. El
  criterio de si esa consecuencia es verdad en tu área es tuyo, no suyo.

---

## Las tres reglas

**1 · Solo tu fichero.** Si necesitas cambiar algo fuera, es señal de que hace falta el CTO.
Abre un issue.

**2 · `npm run check` en verde antes de subir.** Siempre.

**3 · Probado contra dominios reales.** Una regla sin probar no entra.

---

## Qué pasa después

Cuando las reglas de las ocho áreas estén y validadas contra clientes reales, el CTO monta
encima: la pantalla dentro del área de admin, el histórico por cliente, el informe en PDF,
la comparativa con competidores y las integraciones que hoy faltan (la API de anuncios de
Meta y la de velocidad de Google).

**Nada de eso cambia tus reglas.** Por eso este orden: lo que escribes ahora sigue valiendo
igual dentro de seis meses, cuando la aplicación sea otra cosa.
