# Navegación de Valme OS

Cómo se organiza el área por dentro y dónde tocar para añadir algo. Sustituye al selector
de «Módulo» que traía la rama `port/geo-seo-aeo` (`modulos.ts` + `ContextSwitcher`).

---

## 1. Dos espacios

| | **Ventas** | **Clientes** |
| --- | --- | --- |
| Qué es | El tratamiento del lead y el proceso de venta | Los clientes de verdad, después de firmar |
| De quién son los datos | De Valme | Del cliente |
| Rutas | `/app/dx/…` | `/app`, `/app/clients`, `/app/c/<slug>/…`, `/app/seo/…` |
| Cliente activo | No hay | Sí, con «Todos los clientes» como opción |

Se cambia de espacio con el conmutador de arriba del menú principal. Es la misma
separación de permisos de `plan-diagnostico-y-cuentas.md`: no son dos menús, son dos
contextos.

## 2. Dos niveles de menú

```
 Inicio (menú principal abierto)        Un área (plegado a iconos + menú del área)
┌────────────────────┐                 ┌──┬──────────────────┐
│ Valme OS           │                 │V │ SEO · GEO · AEO  │
│ [Ventas|Clientes]  │                 │⇄ │ Nordic Clinic    │
│ ▾ Cliente activo   │                 │NC│ Centro de mando  │
│ ⌂ Inicio      ●    │                 │⌂ │ Onboarding    2  │
│ ◈ Marca            │   ─────────►    │◈ │ Auditorías    5  │
│ ▶ Paid             │                 │▶ │ Plan y tareas    │
│ ⌕ SEO · GEO · AEO  │                 │⌕●│ …                │
│ ☰ CRM · Leads      │                 │☰ │                  │
│ ⚙ Integraciones    │                 │⚙ │                  │
└────────────────────┘                 └──┴──────────────────┘
```

- **Menú principal** (`packages/os/src/ui/MenuPrincipal.tsx`): espacio, cliente activo y áreas.
  En Inicio y en las áreas de una sola pantalla va abierto. En un área con menú propio
  se pliega a iconos; al pasar el ratón (o llegar con el teclado) se despliega por encima
  del contenido y se vuelve a plegar al salir. «Dejar abierto» lo fija.
- **Menú del área** (`MenuArea` en `packages/os/src/ui/Shell.tsx`): lo pinta el layout de cada
  área, con sus contadores y los motivos de bloqueo. No repite el cliente.
- **Pantallas estrechas**: el menú principal es un cajón que se abre desde una barra
  arriba, y el del área pasa a una fila encima del contenido.

### Áreas

| Espacio | Área | Rutas | Menú del área |
| --- | --- | --- | --- |
| Ventas | Leads | `/app/dx/leads/…` | — |
| Ventas | Auditorías | `/app/dx/tools/…` | Todas · Paid · SEO · Web |
| Clientes | Inicio | `/app`, `/app/clients`, `/app/c/<slug>` | — |
| Clientes | Marca | `/app/c/<slug>/brand-kit` | Brand Kit |
| Clientes | Paid | `/app/c/<slug>/offers/…`, `/landings/…` | Ofertas · Landings |
| Clientes | SEO · GEO · AEO | `/app/seo/…` | El del módulo; «Cartera» pasa a «Ficha del cliente» con un cliente activo |
| Clientes | CRM · Leads | `/app/c/<slug>/leads/…` | Leads |
| Clientes | Integraciones (admin) | `/app/c/<slug>/settings` | — |

## 3. El cliente activo

Una sola cookie (`valme_os_last_client`, en `packages/os/src/tenancy/lastClient.ts`) para todo el
espacio Clientes:

- La escribe el proxy al entrar en `/app/c/<slug>/…` y la acción `elegirClienteActivo()`
  desde el selector. Sin cookie es «Todos los clientes».
- **Paid, Marca, CRM e Integraciones** llevan además el cliente en la URL, y ahí manda la
  URL. Cambiar de cliente te deja en la misma sección con el otro cliente. Sin cliente
  activo, su entrada lleva a `/app/clients?area=<área>` para elegir uno.
- **SEO · GEO · AEO** trabaja sobre la cartera y usa la cookie como filtro (`seoModulo()`).
  Sus pantallas de detalle (ficha, plan, onboarding, auditoría, informe) siguen al cliente
  activo: si se cambia de cliente estando en una, se va a la misma pantalla del nuevo, o
  a la lista si no tiene (`packages/os/src/seo/equivalente.ts`).
- **El cliente solo se elige arriba.** Ningún menú de área ni formulario tiene su propio
  selector cuando hay un cliente activo.
- **Inicio**: con un cliente activo es `/app/c/<slug>`; con «Todos», `/app` es el de
  cartera.

La cookie nunca concede acceso: cada página y cada acción pasa por el DAL (`forClient()`,
`seoModulo()`, `diagnostico()`).

## 4. Dónde tocar

- **Añadir un área**: una entrada en `AREAS` (`packages/os/src/ui/navegacion.ts`), su icono en
  `MenuPrincipal.tsx` y su carpeta. Si es de cliente, un grupo de rutas
  `apps/web/src/app/(os)/app/c/[client]/(<área>)/` con un `layout.tsx` que pinte `MenuArea`.
- **Añadir una entrada al menú de un área**: en el `nav` del layout de esa área.
- **Las URLs no dependen del menú**: los grupos de rutas `(inicio)`, `(general)`,
  `(marca)`, `(paid)` y `(crm)` no aparecen en la URL.
- Los tests del mapa (qué área es cada ruta y adónde lleva cambiar de cliente) están en
  `packages/os/src/ui/__tests__/navegacion.test.ts`.

## 5. Pendiente de decidir

- El módulo SEO tiene su propia **cartera de clientes** (ficha de 12 pestañas) y su
  **onboarding**, que da de alta clientes en Valme. De momento siguen dentro del módulo,
  como se propuso. Hay que decidir si la ficha de cliente y el alta suben a nivel del
  espacio Clientes.
